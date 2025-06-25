import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Clock, Phone } from "lucide-react";
import { useLocation } from "wouter";
import { formatDate } from "@/lib/utils";

interface UpcomingVideoCallsProps {
  patientId: number;
}

export function UpcomingVideoCalls({ patientId }: UpcomingVideoCallsProps) {
  const [, setLocation] = useLocation();

  // Fetch video calls for this patient
  const { data: videoCalls = [], isLoading } = useQuery({
    queryKey: ["/api/video-calls", "patient", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/video-calls/patient/${patientId}`);
      if (!response.ok) throw new Error('Failed to fetch video calls');
      return response.json();
    },
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading video calls...</p>
      </div>
    );
  }

  const upcomingCalls = videoCalls.filter((call: any) => {
    const callTime = new Date(call.scheduledTime);
    const now = new Date();
    return callTime > now && call.status !== 'completed';
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {upcomingCalls.length > 0 ? (
        <div className="space-y-3">
          {upcomingCalls.map((call: any) => (
            <div key={call.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Video Consultation</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {call.scheduledTime ? formatDate(new Date(call.scheduledTime)) : 'Date TBD'}
                      <Clock className="h-4 w-4 ml-2" />
                      {call.scheduledTime ? new Date(call.scheduledTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : 'Time TBD'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(call.status)}
                  {call.status === 'active' || (call.scheduledTime && new Date(call.scheduledTime) <= new Date()) ? (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setLocation(`/video-call/${call.roomId}`)}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Join Call
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation(`/video-call/${call.roomId}`)}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Video className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">No Upcoming Video Calls</h3>
          <p className="text-sm text-gray-600 mb-4">
            You don't have any scheduled video consultations at the moment.
          </p>
          <p className="text-xs text-gray-500">
            Your doctor will schedule video consultations when needed for follow-ups or urgent consultations.
          </p>
        </div>
      )}
    </div>
  );
}