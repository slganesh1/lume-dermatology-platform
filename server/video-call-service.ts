import { randomUUID } from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { InsertVideoCall, InsertCallParticipant, InsertCallMessage } from "@shared/video-call-schema";

interface CallParticipant {
  userId: number;
  role: string;
  ws: WebSocket;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface ActiveCall {
  callId: number;
  roomId: string;
  participants: Map<number, CallParticipant>;
  startTime: Date;
}

export class VideoCallService {
  private activeCalls = new Map<string, ActiveCall>();
  private userConnections = new Map<number, WebSocket>();

  constructor(private wss: WebSocketServer) {
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers() {
    this.wss.on("connection", (ws: WebSocket, request) => {
      const url = new URL(request.url || '', 'ws://localhost');
      const type = url.searchParams.get('type');
      
      // Only handle video call connections
      if (type !== 'video-call') {
        return;
      }
      
      console.log("New WebSocket connection for video calls");

      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
          ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        this.handleDisconnection(ws);
      });
    });
  }

  private async handleWebSocketMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case "join_call":
        await this.handleJoinCall(ws, message);
        break;
      case "leave_call":
        await this.handleLeaveCall(ws, message);
        break;
      case "toggle_audio":
        await this.handleToggleAudio(ws, message);
        break;
      case "toggle_video":
        await this.handleToggleVideo(ws, message);
        break;
      case "chat_message":
        await this.handleChatMessage(ws, message);
        break;
      case "webrtc_offer":
      case "webrtc_answer":
      case "webrtc_ice_candidate":
        await this.handleWebRTCSignaling(ws, message);
        break;
      default:
        ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
    }
  }

  private async handleJoinCall(ws: WebSocket, message: any) {
    const { roomId, userId, role } = message;

    if (!roomId || !userId || !role) {
      ws.send(JSON.stringify({ type: "error", message: "Missing required parameters" }));
      return;
    }

    // Get call info from database
    const call = await storage.getVideoCallByRoomId(roomId);
    if (!call) {
      ws.send(JSON.stringify({ type: "error", message: "Call not found" }));
      return;
    }

    // Verify user has permission to join this call
    const canJoin = (role === "patient" && call.patientId === userId) || 
                   (role === "doctor" && call.doctorId === userId);
    
    if (!canJoin) {
      ws.send(JSON.stringify({ type: "error", message: "Not authorized to join this call" }));
      return;
    }

    // Add participant to active call
    if (!this.activeCalls.has(roomId)) {
      this.activeCalls.set(roomId, {
        callId: call.id,
        roomId,
        participants: new Map(),
        startTime: new Date()
      });
    }

    const activeCall = this.activeCalls.get(roomId)!;
    const participant: CallParticipant = {
      userId,
      role,
      ws,
      audioEnabled: true,
      videoEnabled: true
    };

    activeCall.participants.set(userId, participant);
    this.userConnections.set(userId, ws);

    // Update call status and participant in database
    if (activeCall.participants.size === 1) {
      await storage.updateVideoCallStatus(call.id, "active", new Date());
    }

    await storage.createCallParticipant({
      callId: call.id,
      userId,
      role,
      joinedAt: new Date(),
      connectionStatus: "online",
      audioEnabled: true,
      videoEnabled: true
    });

    // Notify all participants
    this.broadcastToCall(roomId, {
      type: "participant_joined",
      userId,
      role,
      participantCount: activeCall.participants.size
    });

    // Send current participants list to new joiner
    const participants = Array.from(activeCall.participants.values()).map(p => ({
      userId: p.userId,
      role: p.role,
      audioEnabled: p.audioEnabled,
      videoEnabled: p.videoEnabled
    }));

    ws.send(JSON.stringify({
      type: "call_joined",
      roomId,
      participants
    }));
  }

  private async handleLeaveCall(ws: WebSocket, message: any) {
    const { roomId, userId } = message;
    
    const activeCall = this.activeCalls.get(roomId);
    if (!activeCall) return;

    // Remove participant
    const participant = activeCall.participants.get(userId);
    if (participant) {
      activeCall.participants.delete(userId);
      this.userConnections.delete(userId);

      // Update database
      await storage.updateCallParticipantLeftAt(activeCall.callId, userId, new Date());

      // Notify other participants
      this.broadcastToCall(roomId, {
        type: "participant_left",
        userId,
        participantCount: activeCall.participants.size
      });

      // End call if no participants left
      if (activeCall.participants.size === 0) {
        await this.endCall(roomId);
      }
    }
  }

  private async handleToggleAudio(ws: WebSocket, message: any) {
    const { roomId, userId, audioEnabled } = message;
    
    const activeCall = this.activeCalls.get(roomId);
    if (!activeCall) return;

    const participant = activeCall.participants.get(userId);
    if (participant) {
      participant.audioEnabled = audioEnabled;
      
      // Update database
      await storage.updateCallParticipantAudio(activeCall.callId, userId, audioEnabled);

      // Notify other participants
      this.broadcastToCall(roomId, {
        type: "audio_toggled",
        userId,
        audioEnabled
      }, userId);
    }
  }

  private async handleToggleVideo(ws: WebSocket, message: any) {
    const { roomId, userId, videoEnabled } = message;
    
    const activeCall = this.activeCalls.get(roomId);
    if (!activeCall) return;

    const participant = activeCall.participants.get(userId);
    if (participant) {
      participant.videoEnabled = videoEnabled;
      
      // Update database
      await storage.updateCallParticipantVideo(activeCall.callId, userId, videoEnabled);

      // Notify other participants
      this.broadcastToCall(roomId, {
        type: "video_toggled",
        userId,
        videoEnabled
      }, userId);
    }
  }

  private async handleChatMessage(ws: WebSocket, message: any) {
    const { roomId, userId, text } = message;
    
    const activeCall = this.activeCalls.get(roomId);
    if (!activeCall) return;

    // Save message to database
    const chatMessage = await storage.createCallMessage({
      callId: activeCall.callId,
      senderId: userId,
      message: text,
      messageType: "text"
    });

    // Broadcast to all participants
    this.broadcastToCall(roomId, {
      type: "chat_message",
      messageId: chatMessage.id,
      senderId: userId,
      message: text,
      timestamp: chatMessage.timestamp
    });
  }

  private async handleWebRTCSignaling(ws: WebSocket, message: any) {
    const { roomId, targetUserId, ...signalData } = message;
    
    const activeCall = this.activeCalls.get(roomId);
    if (!activeCall) return;

    // Forward signaling message to target user
    const targetParticipant = activeCall.participants.get(targetUserId);
    if (targetParticipant) {
      targetParticipant.ws.send(JSON.stringify({
        ...signalData,
        fromUserId: message.userId
      }));
    }
  }

  private handleDisconnection(ws: WebSocket) {
    // Find and remove user from active calls
    for (const [userId, userWs] of this.userConnections.entries()) {
      if (userWs === ws) {
        this.userConnections.delete(userId);
        
        // Find and leave all calls
        for (const [roomId, activeCall] of this.activeCalls.entries()) {
          if (activeCall.participants.has(userId)) {
            this.handleLeaveCall(ws, { roomId, userId });
          }
        }
        break;
      }
    }
  }

  private broadcastToCall(roomId: string, message: any, excludeUserId?: number) {
    const activeCall = this.activeCalls.get(roomId);
    if (!activeCall) return;

    const messageStr = JSON.stringify(message);
    
    for (const [userId, participant] of activeCall.participants.entries()) {
      if (excludeUserId && userId === excludeUserId) continue;
      
      if (participant.ws.readyState === WebSocket.OPEN) {
        participant.ws.send(messageStr);
      }
    }
  }

  private async endCall(roomId: string) {
    const activeCall = this.activeCalls.get(roomId);
    if (!activeCall) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeCall.startTime.getTime()) / 1000 / 60);

    // Update call in database
    await storage.updateVideoCallStatus(activeCall.callId, "ended", undefined, endTime, duration);

    // Remove from active calls
    this.activeCalls.delete(roomId);
  }

  // Public methods for call management
  async createVideoCall(appointmentId: number, patientId: number, doctorId: number, scheduledTime: Date): Promise<string> {
    const roomId = `call_${randomUUID()}`;
    
    const call = await storage.createVideoCall({
      appointmentId,
      patientId,
      doctorId,
      roomId,
      status: "scheduled",
      scheduledTime
    });

    return roomId;
  }

  async getCallHistory(userId: number, role: string): Promise<any[]> {
    return await storage.getVideoCallsForUser(userId, role);
  }

  async getActiveCall(roomId: string): Promise<ActiveCall | undefined> {
    return this.activeCalls.get(roomId);
  }
}