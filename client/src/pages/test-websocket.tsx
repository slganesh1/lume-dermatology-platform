import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery } from "@tanstack/react-query";

export default function TestWebSocketPage() {
  const { user } = useAuth();
  const { isConnected, lastMessage } = useWebSocket();
  const [messages, setMessages] = useState<any[]>([]);

  // Get latest analysis for this patient
  const { data: analyses } = useQuery({
    queryKey: ['/api/skin-analyses/patient', user?.id],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (lastMessage) {
      setMessages(prev => [...prev, {
        ...lastMessage,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [lastMessage]);

  const latestAnalysis = Array.isArray(analyses) ? analyses[0] : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">WebSocket Test Page</h1>
      
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            User: {user?.username} (ID: {user?.id}, Role: {user?.role})
          </p>
        </CardContent>
      </Card>

      {/* Latest Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          {latestAnalysis ? (
            <div className="space-y-4">
              <div>
                <strong>Analysis ID:</strong> {latestAnalysis.id}
              </div>
              <div>
                <strong>Status:</strong> {latestAnalysis.validationStatus || 'pending'}
              </div>
              <div>
                <strong>Created:</strong> {new Date(latestAnalysis.createdAt).toLocaleString()}
              </div>
              
              {latestAnalysis.expertResults && (
                <div className="bg-green-50 p-4 rounded border">
                  <h4 className="font-semibold text-green-800">Expert Validation Complete</h4>
                  <pre className="text-sm mt-2 whitespace-pre-wrap">
                    {JSON.stringify(latestAnalysis.expertResults, null, 2)}
                  </pre>
                </div>
              )}
              
              {latestAnalysis.expertComments && (
                <div className="bg-blue-50 p-4 rounded border">
                  <strong>Expert Comments:</strong>
                  <p className="mt-1">{latestAnalysis.expertComments}</p>
                </div>
              )}
            </div>
          ) : (
            <p>No analyses found</p>
          )}
        </CardContent>
      </Card>

      {/* Real-time Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Messages ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {messages.slice(-5).map((msg, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded text-sm">
                  <div className="font-semibold">Type: {msg.type}</div>
                  <div>Time: {new Date(msg.timestamp).toLocaleTimeString()}</div>
                  {msg.message && <div>Message: {msg.message}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No real-time messages received yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}