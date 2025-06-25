import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import DoctorDashboard from "@/components/doctor-dashboard";
import PatientDashboard from "@/components/patient-dashboard";
import AssistantDashboard from "@/components/assistant-dashboard";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Check if the user is logged in
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-4">
          <p className="font-medium">Authentication required</p>
          <p className="text-sm">Please login to access the dashboard.</p>
        </div>
      </div>
    );
  }
  
  // Show different dashboards based on user roles
  switch (user.role) {
    case "doctor":
      return <DoctorDashboard />;
    case "patient":
      return <PatientDashboard />;
    case "assistant":
      return <AssistantDashboard />;
    default:
      return (
        <div className="container mx-auto py-8">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-4">
            <p className="font-medium">Unknown user role</p>
            <p className="text-sm">Your account type ({user.role}) is not recognized. Please contact support.</p>
          </div>
        </div>
      );
  }
}
