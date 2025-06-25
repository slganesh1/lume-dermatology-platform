import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  MessageSquare,
  Settings,
  Users,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { VideoCallChat } from "./video-call-chat";

interface VideoCallProps {
  roomId: string;
  appointmentId?: number;
  onCallEnd?: () => void;
}

interface Participant {
  userId: number;
  role: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export function VideoCall({ roomId, appointmentId, onCallEnd }: VideoCallProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, [roomId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isConnected && callStartTimeRef.current) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTimeRef.current!.getTime()) / 1000);
        setCallDuration(duration);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Setup WebSocket connection  
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?type=video-call&roomId=${roomId}&userId=${user?.id}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setConnectionStatus("connected");
        joinCall();
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      wsRef.current.onclose = () => {
        setConnectionStatus("disconnected");
        setIsConnected(false);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("disconnected");
      };

    } catch (error) {
      console.error("Error initializing call:", error);
      alert("Unable to access camera/microphone. Please check permissions and try again.");
    }
  };

  const joinCall = () => {
    if (wsRef.current && user) {
      wsRef.current.send(JSON.stringify({
        type: "join_call",
        roomId,
        userId: user.id,
        role: user.role,
        appointmentId
      }));
    }
  };

  const handleWebSocketMessage = (message: any) => {
    console.log("Video call WebSocket message:", message);
    
    switch (message.type) {
      case "call_joined":
        console.log("Call joined successfully");
        setIsConnected(true);
        setParticipants(message.participants || []);
        callStartTimeRef.current = new Date();
        break;
        
      case "participant_joined":
        console.log("Participant joined:", message.userId);
        setParticipants(prev => [...prev.filter(p => p.userId !== message.userId), {
          userId: message.userId,
          role: message.role,
          audioEnabled: true,
          videoEnabled: true
        }]);
        
        // Initiate WebRTC connection for new participant
        if (message.userId !== user?.id) {
          initiateWebRTCConnection(message.userId);
        }
        break;
        
      case "participant_left":
        setParticipants(prev => prev.filter(p => p.userId !== message.userId));
        break;
        
      case "audio_toggled":
        setParticipants(prev => prev.map(p => 
          p.userId === message.userId 
            ? { ...p, audioEnabled: message.audioEnabled }
            : p
        ));
        break;
        
      case "video_toggled":
        setParticipants(prev => prev.map(p => 
          p.userId === message.userId 
            ? { ...p, videoEnabled: message.videoEnabled }
            : p
        ));
        break;
        
      case "webrtc_offer":
        handleWebRTCOffer(message);
        break;
        
      case "webrtc_answer":
        handleWebRTCAnswer(message);
        break;
        
      case "webrtc_ice_candidate":
        handleWebRTCIceCandidate(message);
        break;
    }
  };

  const initiateWebRTCConnection = async (targetUserId: number) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    peerConnectionRef.current = peerConnection;

    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: "webrtc_ice_candidate",
          roomId,
          targetUserId,
          userId: user?.id,
          candidate: event.candidate
        }));
      }
    };

    // Create and send offer
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: "webrtc_offer",
          roomId,
          targetUserId,
          userId: user?.id,
          offer
        }));
      }
    } catch (error) {
      console.error("Error creating WebRTC offer:", error);
    }
  };

  const handleWebRTCOffer = async (message: any) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    peerConnectionRef.current = peerConnection;

    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: "webrtc_ice_candidate",
          roomId,
          targetUserId: message.fromUserId,
          userId: user?.id,
          candidate: event.candidate
        }));
      }
    };

    try {
      await peerConnection.setRemoteDescription(message.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: "webrtc_answer",
          roomId,
          targetUserId: message.fromUserId,
          userId: user?.id,
          answer
        }));
      }
    } catch (error) {
      console.error("Error handling WebRTC offer:", error);
    }
  };

  const handleWebRTCAnswer = async (message: any) => {
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.setRemoteDescription(message.answer);
      } catch (error) {
        console.error("Error handling WebRTC answer:", error);
      }
    }
  };

  const handleWebRTCIceCandidate = async (message: any) => {
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.addIceCandidate(message.candidate);
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
        
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: "toggle_audio",
            roomId,
            userId: user?.id,
            audioEnabled: !audioEnabled
          }));
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
        
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: "toggle_video",
            roomId,
            userId: user?.id,
            videoEnabled: !videoEnabled
          }));
        }
      }
    }
  };

  const endCall = () => {
    if (wsRef.current && user) {
      wsRef.current.send(JSON.stringify({
        type: "leave_call",
        roomId,
        userId: user.id
      }));
    }
    
    cleanup();
    onCallEnd?.();
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    setIsConnected(false);
    setParticipants([]);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/50 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant={connectionStatus === "connected" ? "default" : "destructive"}>
            {connectionStatus}
          </Badge>
          <div className="flex items-center text-white">
            <Clock className="h-4 w-4 mr-2" />
            <span>{formatDuration(callDuration)}</span>
          </div>
          <div className="flex items-center text-white">
            <Users className="h-4 w-4 mr-2" />
            <span>{participants.length} participants</span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowChat(!showChat)}
          className="text-white border-white hover:bg-white/10"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </Button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-800"
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!videoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg">
            <VideoCallChat roomId={roomId} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/80 p-6">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={audioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="w-12 h-12 rounded-full"
          >
            {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          
          <Button
            variant={videoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="w-12 h-12 rounded-full"
          >
            {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            onClick={endCall}
            className="w-12 h-12 rounded-full"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Participant Status */}
        <div className="mt-4 flex justify-center space-x-4">
          {participants.map((participant) => (
            <div key={participant.userId} className="flex items-center space-x-2 text-white text-sm">
              <span className="capitalize">{participant.role}</span>
              {!participant.audioEnabled && <MicOff className="h-3 w-3 text-red-400" />}
              {!participant.videoEnabled && <VideoOff className="h-3 w-3 text-red-400" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}