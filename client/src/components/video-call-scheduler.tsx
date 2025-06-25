import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Video, Calendar, Clock } from "lucide-react";
import { useLocation } from "wouter";

interface VideoCallSchedulerProps {
  patientId?: number;
  onScheduled?: (videoCall: any) => void;
}

export function VideoCallScheduler({ patientId, onScheduled }: VideoCallSchedulerProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(patientId?.toString() || "");

  // Fetch patients for doctor to select from
  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
  });

  // Fetch doctors
  const { data: doctors = [] } = useQuery({
    queryKey: ["/api/doctors"],
  });

  const scheduleVideoCallMutation = useMutation({
    mutationFn: async (videoCallData: any) => {
      const response = await apiRequest("POST", "/api/video-calls", videoCallData);
      return response.json();
    },
    onSuccess: (videoCall) => {
      toast({
        title: "Video Call Scheduled",
        description: "The video consultation has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/video-calls"] });
      onScheduled?.(videoCall);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startInstantCallMutation = useMutation({
    mutationFn: async (videoCallData: any) => {
      const response = await apiRequest("POST", "/api/video-calls", {
        ...videoCallData,
        status: "active",
        scheduledTime: new Date().toISOString(),
        startTime: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: (videoCall) => {
      toast({
        title: "Video Call Started",
        description: "Joining the video consultation now.",
      });
      setLocation(`/video-call/${videoCall.roomId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScheduleCall = () => {
    if (!scheduledDate || !scheduledTime || !selectedPatientId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    
    scheduleVideoCallMutation.mutate({
      patientId: parseInt(selectedPatientId),
      doctorId: doctors[0]?.id || 27, // Default to first doctor or expert
      scheduledTime: scheduledDateTime.toISOString(),
    });
  };

  const handleStartInstantCall = () => {
    if (!selectedPatientId) {
      toast({
        title: "Missing Information", 
        description: "Please select a patient.",
        variant: "destructive",
      });
      return;
    }

    startInstantCallMutation.mutate({
      patientId: parseInt(selectedPatientId),
      doctorId: doctors[0]?.id || 27, // Default to first doctor or expert
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Consultation Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!patientId && (
            <div>
              <Label htmlFor="patient">Patient</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient: any) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.name} (PID: {patient.pid})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleScheduleCall}
              disabled={scheduleVideoCallMutation.isPending}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Call
            </Button>
            
            <Button 
              onClick={handleStartInstantCall}
              disabled={startInstantCallMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              <Video className="h-4 w-4 mr-2" />
              Start Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Video Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <UpcomingVideoCalls patientId={patientId} />
        </CardContent>
      </Card>
    </div>
  );
}

function UpcomingVideoCalls({ patientId }: { patientId?: number }) {
  const [, setLocation] = useLocation();
  
  const { data: videoCalls = [] } = useQuery({
    queryKey: ["/api/video-calls"],
  });

  const filteredCalls = patientId 
    ? videoCalls.filter((call: any) => call.patientId === patientId)
    : videoCalls;

  const upcomingCalls = filteredCalls.filter((call: any) => 
    call.status === "scheduled" && new Date(call.scheduledTime) > new Date()
  );

  if (upcomingCalls.length === 0) {
    return <p className="text-muted-foreground">No upcoming video calls scheduled.</p>;
  }

  return (
    <div className="space-y-3">
      {upcomingCalls.map((call: any) => (
        <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">Video Consultation</p>
            <p className="text-sm text-muted-foreground">
              {new Date(call.scheduledTime).toLocaleDateString()} at {' '}
              {new Date(call.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Button 
            size="sm"
            onClick={() => setLocation(`/video-call/${call.roomId}`)}
          >
            <Video className="h-4 w-4 mr-2" />
            Join
          </Button>
        </div>
      ))}
    </div>
  );
}