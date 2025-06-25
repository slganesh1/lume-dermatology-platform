import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VideoCall } from "@/components/video-call";
import { VideoCallScheduler } from "@/components/video-call-scheduler";
import { Video, Users, TestTube } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function VideoTestPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [testRoomId, setTestRoomId] = useState("test-room-" + Date.now());
  const [isInCall, setIsInCall] = useState(false);

  const startTestCall = () => {
    setIsInCall(true);
  };

  const endTestCall = () => {
    setIsInCall(false);
    setTestRoomId("test-room-" + Date.now()); // Generate new room ID
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">Please login to test video calls.</p>
            <Button onClick={() => setLocation("/auth")}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInCall) {
    return (
      <VideoCall 
        roomId={testRoomId} 
        onCallEnd={endTestCall}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Call Testing</h1>
            <p className="text-gray-600">Test the video conferencing functionality</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Quick Test Call
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="room-id">Test Room ID</Label>
                <Input
                  id="room-id"
                  value={testRoomId}
                  onChange={(e) => setTestRoomId(e.target.value)}
                  placeholder="Enter room ID"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Current user: <strong>{user.username}</strong> ({user.role})
                </p>
                <p className="text-sm text-muted-foreground">
                  This will start a test video call in room: <strong>{testRoomId}</strong>
                </p>
              </div>

              <Button 
                onClick={startTestCall}
                className="w-full"
                size="lg"
              >
                <Video className="h-4 w-4 mr-2" />
                Start Test Call
              </Button>
            </CardContent>
          </Card>

          {/* Video Call Scheduler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Production Scheduler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VideoCallScheduler />
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Single User Test:</h4>
                <ol className="text-sm space-y-1 text-muted-foreground">
                  <li>1. Click "Start Test Call"</li>
                  <li>2. Allow camera/microphone access</li>
                  <li>3. Verify local video appears</li>
                  <li>4. Test audio/video toggle buttons</li>
                  <li>5. Test chat functionality</li>
                  <li>6. Click end call to return</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Multi-User Test:</h4>
                <ol className="text-sm space-y-1 text-muted-foreground">
                  <li>1. Share the room ID with another user</li>
                  <li>2. Both users join the same room</li>
                  <li>3. Verify WebRTC peer connection</li>
                  <li>4. Test two-way audio/video</li>
                  <li>5. Test chat between users</li>
                  <li>6. Test participant controls</li>
                </ol>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Technical Features:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• WebRTC peer-to-peer video/audio streaming</li>
                <li>• WebSocket signaling for connection setup</li>
                <li>• Real-time chat messaging</li>
                <li>• Audio/video controls (mute, camera off)</li>
                <li>• Participant status tracking</li>
                <li>• Call duration monitoring</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}