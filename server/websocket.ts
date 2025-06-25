import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';

interface WebSocketClient {
  ws: WebSocket;
  userId: number;
  role: string;
  patientId?: number;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket, request: any) {
    const { query } = parse(request.url, true);
    const userId = query.userId as string;
    const role = query.role as string;
    const patientId = query.patientId as string;

    if (!userId || !role) {
      ws.close(1008, 'Missing authentication data');
      return;
    }

    const clientId = `${userId}-${role}`;
    const client: WebSocketClient = {
      ws,
      userId: parseInt(userId),
      role,
      patientId: patientId ? parseInt(patientId) : undefined
    };

    this.clients.set(clientId, client);
    console.log(`WebSocket client connected: ${clientId} (${role})`);

    // Send connection confirmation
    this.sendToClient(clientId, {
      type: 'connection_confirmed',
      userId: client.userId,
      role: client.role,
      timestamp: new Date().toISOString()
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(clientId, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
      this.clients.delete(clientId);
    });
  }

  private handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'subscribe_to_analysis':
        this.handleAnalysisSubscription(client, message.analysisId);
        break;
      case 'subscribe_to_patient':
        this.handlePatientSubscription(client, message.patientId);
        break;
      case 'ping':
        this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
        break;
    }
  }

  private handleAnalysisSubscription(client: WebSocketClient, analysisId: number) {
    console.log(`Client ${client.userId} (${client.role}) subscribed to analysis ${analysisId}`);
    this.sendToClient(`${client.userId}-${client.role}`, {
      type: 'subscription_confirmed',
      analysisId,
      message: `Subscribed to analysis ${analysisId} updates`
    });
  }

  private handlePatientSubscription(client: WebSocketClient, patientId: number) {
    console.log(`Client ${client.userId} (${client.role}) subscribed to patient ${patientId}`);
    this.sendToClient(`${client.userId}-${client.role}`, {
      type: 'subscription_confirmed',
      patientId,
      message: `Subscribed to patient ${patientId} updates`
    });
  }

  public sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Notify when expert validates an analysis
  public notifyAnalysisValidated(analysisId: number, patientId: number, expertResults: any) {
    console.log(`Broadcasting analysis validation for analysis ${analysisId}, patient ${patientId}`);
    
    // Find all clients subscribed to this patient or analysis
    this.clients.forEach((client, clientId) => {
      const shouldNotify = 
        (client.role === 'patient' && client.patientId === patientId) ||
        (client.role === 'doctor') ||
        (client.userId.toString() === patientId.toString());

      if (shouldNotify) {
        this.sendToClient(clientId, {
          type: 'analysis_validated',
          analysisId,
          patientId,
          expertResults,
          message: 'Your skin analysis has been validated by an expert',
          timestamp: new Date().toISOString()
        });
        console.log(`Sent validation notification to ${clientId}`);
      }
    });
  }

  // Notify when new analysis is submitted
  public notifyNewAnalysis(analysisId: number, patientId: number, analysisData: any) {
    console.log(`Broadcasting new analysis ${analysisId} for patient ${patientId}`);
    
    // Notify all experts
    this.clients.forEach((client, clientId) => {
      if (client.role === 'doctor') {
        this.sendToClient(clientId, {
          type: 'new_analysis_submitted',
          analysisId,
          patientId,
          analysisData,
          message: 'New analysis submitted for validation',
          timestamp: new Date().toISOString()
        });
        console.log(`Sent new analysis notification to expert ${clientId}`);
      }
    });
  }

  // Get connected clients info
  public getConnectedClients() {
    const clients = Array.from(this.clients.entries()).map(([id, client]) => ({
      id,
      userId: client.userId,
      role: client.role,
      patientId: client.patientId,
      connected: client.ws.readyState === WebSocket.OPEN
    }));
    return clients;
  }
}

export { WebSocketManager };