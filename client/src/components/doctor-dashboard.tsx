import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Activity, Calendar, FileText, Plus, User, Camera, Search, Shield, TrendingUp, Clock, Video } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type Appointment, type Patient } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { AvatarProfile } from "@/components/ui/avatar-profile";
import { VideoCallScheduler } from "./video-call-scheduler";

export default function DoctorDashboard() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Get today's date in YYYY-MM-DD format for API
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];

  // Fetch all appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["/api/appointments"],
  });

  // Fetch today's appointments
  const { data: todayAppointments, isLoading: isLoadingTodayAppointments } = useQuery({
    queryKey: ["/api/appointments/date", todayFormatted],
    queryFn: async () => {
      const response = await fetch(`/api/appointments/date/${todayFormatted}`);
      if (!response.ok) throw new Error('Failed to fetch today\'s appointments');
      return await response.json();
    }
  });

  // Fetch patients
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/patients"],
  });

  // Fetch skin analyses
  const { data: skinAnalyses, isLoading: isLoadingSkinAnalyses } = useQuery({
    queryKey: ["/api/skin-analyses"],
  });

  // Calculate stats
  const patientCount = Array.isArray(patients) ? patients.length : 0;
  const todayAppointmentCount = Array.isArray(todayAppointments) ? todayAppointments.length : 0;

  const upcomingAppointments = Array.isArray(appointments) 
    ? appointments.filter((apt: Appointment) => {
        const today = new Date();
        const aptDate = new Date(apt.date);
        return aptDate >= today && apt.status !== "Cancelled";
      })
    : [];

  const analysesCount = Array.isArray(skinAnalyses) 
    ? skinAnalyses.length
    : 0;

  // Prepare table columns
  const appointmentColumns = [
    {
      header: "Patient",
      accessor: (row: Appointment) => {
        const patient = Array.isArray(patients) 
          ? patients.find((p: Patient) => p.id === row.patientId) 
          : undefined;
        
        return (
          <div className="flex items-center">
            <AvatarProfile
              src={patient?.profileImage || undefined}
              name={patient?.name || "Unknown Patient"}
              size="md"
            />
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {patient?.name || "Unknown Patient"}
              </div>
              <div className="text-sm text-gray-500">PID: {patient?.pid}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Date & Time",
      accessor: (row: Appointment) => (
        <div>
          <div className="text-sm font-medium">{formatDate(new Date(row.date))}</div>
          <div className="text-sm text-muted-foreground">{row.time}</div>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: (row: Appointment) => (
        <div className="text-sm">{row.type}</div>
      ),
    },
    {
      header: "Status",
      accessor: (row: Appointment) => {
        let badgeVariant = "secondary";
        if (row.status === "Confirmed") badgeVariant = "success";
        if (row.status === "Checked In") badgeVariant = "default";
        if (row.status === "Cancelled") badgeVariant = "destructive";
        if (row.status === "Pending") badgeVariant = "warning";
        
        return (
          <Badge variant={badgeVariant as any}>{row.status}</Badge>
        );
      },
    },
    {
      header: "Actions",
      accessor: (row: Appointment) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation(`/appointments/${row.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl mb-8 shadow-lg">
        <div className="absolute inset-0 w-full h-full">
          <img src="/src/assets/skin-background.jpg" alt="Skin care background" className="absolute inset-0 w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/80"></div>
        </div>
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center">
          <div className="md:w-2/3 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Welcome Dr. {user?.name?.split(' ')[0]}</h1>
            <p className="text-xl opacity-90 mb-2 text-white">Advanced diagnostics and patient management platform</p>
            <p className="text-sm text-primary mb-6 uppercase tracking-wider font-light">Bringing Brightness</p>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => setLocation("/skin-analysis")} 
                className="bg-primary text-black hover:bg-primary/90"
                size="lg"
              >
                <Camera className="h-5 w-5 mr-2" /> Analyze Skin Condition
              </Button>
              <Button 
                onClick={() => setLocation("/patients")} 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/10"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" /> Add New Patient
              </Button>
            </div>
          </div>
          <div className="md:w-1/3 flex flex-col items-center justify-center">
            <div className="rounded-full bg-black border-2 border-primary p-6 h-32 w-32 mb-4 flex items-center justify-center">
              <svg
                className="w-20 h-20 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a9 9 0 0 0-9 9s2 6 9 6 9-6 9-6a9 9 0 0 0-9-9z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">LUME</h2>
              <p className="text-primary text-sm uppercase tracking-widest">Bringing Brightness</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Total Patients</CardDescription>
            <CardTitle className="text-2xl">{patientCount || "-"}</CardTitle>
          </CardHeader>
          <CardContent>
            <User className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Today's Appointments</CardDescription>
            <CardTitle className="text-2xl">{todayAppointmentCount || "-"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Skin Analyses</CardDescription>
            <CardTitle className="text-2xl">{analysesCount || "-"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Activity className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
      </div>
      
      {/* Today's Appointments */}
      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" /> 
              Today's Appointments
            </CardTitle>
            <CardDescription>
              {todayFormatted && formatDate(new Date(todayFormatted))}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/appointments")}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingTodayAppointments ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : Array.isArray(todayAppointments) && todayAppointments.length > 0 ? (
            <DataTable
              columns={appointmentColumns}
              data={todayAppointments}
              keyField="id"
              onRowClick={(row) => setLocation(`/appointments/${row.id}`)}
              isLoading={isLoadingTodayAppointments}
            />
          ) : (
            <div className="text-center py-10 bg-muted/20 rounded-lg">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No appointments scheduled for today</h3>
              <p className="text-muted-foreground mb-4">Enjoy your free time or check upcoming appointments</p>
              <Button onClick={() => setLocation("/appointments")}>
                View All Appointments
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Feature Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-primary" /> 
                  AI-Powered Skin Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Utilize advanced AI to identify and analyze skin conditions with high accuracy. Upload patient photos for instant assessment and treatment recommendations.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => setLocation("/skin-analysis")} 
                    variant="outline" 
                    className="border-primary text-primary hover:bg-primary/10 w-full"
                  >
                    Start Analysis
                  </Button>
                  
                  {Array.isArray(patients) && patients.length > 0 && (
                    <Button 
                      onClick={() => setLocation("/patients/7/comparison")}
                      variant="outline"
                      className="border-primary/60 text-primary/80 hover:bg-primary/5 w-full"
                      size="sm"
                    >
                      Test Skin Comparison
                    </Button>
                  )}
                </div>
              </CardContent>
            </div>
            <div className="md:w-1/2 bg-gradient-to-br from-primary/5 to-black/5 flex items-center justify-center p-4">
              <div className="rounded-lg overflow-hidden shadow-md">
                <img 
                  src="/src/assets/dermatology-treatment.jpg" 
                  alt="Dermatology treatment" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" /> 
                  Appointment Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  View and manage patient appointments efficiently. Track follow-ups, update appointment status, and monitor your clinic schedule.
                </p>
                <Button 
                  onClick={() => setLocation("/appointments")} 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Manage Appointments
                </Button>
              </CardContent>
            </div>
            <div className="md:w-1/2 bg-gradient-to-br from-primary/5 to-black/5 flex items-center justify-center p-4">
              <div className="rounded-lg overflow-hidden shadow-md">
                <img 
                  src="/src/assets/appointment-image.jpg" 
                  alt="Appointment scheduling" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Patient Management Section */}
      <Card className="mb-8 overflow-hidden border-2 border-primary/20 shadow-lg">
        <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-3/5 p-6">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-primary/20 p-3 mr-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Patient Management</h2>
            </div>
            <p className="text-gray-600 mb-6 text-lg">
              Access comprehensive patient records, medical histories, and treatment plans. 
              Quickly review past visits, track patient progress, and maintain detailed medical records.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => setLocation("/patients")}
                className="bg-primary text-black hover:bg-primary/90"
              >
                <User className="h-5 w-5 mr-2" /> View All Patients
              </Button>
              <Button
                onClick={() => setLocation("/patients/new")}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Plus className="h-5 w-5 mr-2" /> Add New Patient
              </Button>
            </div>
          </div>
          <div className="md:w-2/5 bg-gradient-to-br from-primary/5 to-black/5 p-6 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-3">
              {Array.isArray(patients) && patients.slice(0, 4).map((patient: Patient) => (
                <div 
                  key={patient.id} 
                  className="bg-white rounded-lg shadow-md p-3 flex flex-col items-center cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setLocation(`/patients/${patient.id}`)}
                >
                  <AvatarProfile
                    src={patient.profileImage || undefined}
                    name={patient.name}
                    size="md"
                  />
                  <div className="mt-2 text-center">
                    <div className="font-medium text-sm truncate max-w-[90px]">{patient.name}</div>
                    <div className="text-xs text-muted-foreground">PID: {patient.pid}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Video Consultations */}
      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="h-5 w-5 mr-2 text-primary" /> 
            Video Consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VideoCallScheduler />
        </CardContent>
      </Card>
    </div>
  );
}