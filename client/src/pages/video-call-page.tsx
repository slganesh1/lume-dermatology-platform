import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { VideoCall } from "@/components/video-call";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function VideoCallPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [roomId, setRoomId] = useState<string>("");

  useEffect(() => {
    // Extract room ID from URL
    const path = window.location.pathname;
    const matches = path.match(/\/video-call\/(.+)/);
    
    if (matches && matches[1]) {
      setRoomId(matches[1]);
    } else {
      // Invalid URL, redirect to dashboard
      setLocation("/");
    }
  }, [location, setLocation]);

  const handleCallEnd = () => {
    setLocation("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">Please login to join the video call.</p>
            <Button onClick={() => setLocation("/auth")}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">Invalid video call link.</p>
            <Button onClick={() => setLocation("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <VideoCall 
      roomId={roomId} 
      onCallEnd={handleCallEnd}
    />
  );
}