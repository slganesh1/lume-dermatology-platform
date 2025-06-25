import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { queryClient } from "../lib/queryClient";

interface WebSocketMessage {
  type: string;
  analysisId?: number;
  patientId?: number;
  expertResults?: any;
  expertComments?: string;
  message?: string;
  timestamp?: string;
  status?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  subscribeToAnalysis: (analysisId: number) => void;
  subscribeToPatient: (patientId: number) => void;
  lastMessage: WebSocketMessage | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const connect = () => {
    if (!user) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}&role=${user.role}&patientId=${user.id || ''}`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          setLastMessage(message);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(() => {
          if (user) connect();
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection_confirmed':
        console.log('WebSocket connection confirmed');
        break;

      case 'analysis_validated':
        toast({
          title: "Analysis Complete",
          description: message.message || "Your skin analysis has been validated by an expert",
        });
        break;

      case 'new_analysis_submitted':
        if (user?.role === 'doctor') {
          toast({
            title: "New Analysis",
            description: message.message || "New analysis submitted for validation",
          });
          
          // Refresh analyses for experts
          queryClient.invalidateQueries({ queryKey: ['/api/skin-analyses'] });
          queryClient.invalidateQueries({ queryKey: ['/api/analysis-validations'] });
        }
        break;

      case 'subscription_confirmed':
        console.log('Subscription confirmed:', message);
        break;

      case 'pong':
        // Handle ping/pong for connection keep-alive
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  };

  const subscribeToAnalysis = (analysisId: number) => {
    sendMessage({
      type: 'subscribe_to_analysis',
      analysisId
    });
  };

  const subscribeToPatient = (patientId: number) => {
    sendMessage({
      type: 'subscribe_to_patient',
      patientId
    });
  };

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user]);

  // Keep connection alive with periodic ping
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      sendMessage,
      subscribeToAnalysis,
      subscribeToPatient,
      lastMessage
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}