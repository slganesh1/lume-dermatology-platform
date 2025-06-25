import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Activity, Calendar, FileText, Camera, User, Clock, Video } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type Appointment, type Patient, type Prescription, type SkinAnalysis } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { AppDownloadLinks } from "@/components/app-download-links";
import { UpcomingVideoCalls } from "@/components/upcoming-video-calls";

export default function PatientDashboard() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Fetch the patient data for this user
  const { data: patientData, isLoading: isLoadingPatient } = useQuery({
    queryKey: ["/api/patients/user", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients/user/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch patient data');
      return await response.json();
    },
    enabled: !!user?.id
  });

  // Fetch patient's appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["/api/appointments/patient", patientData?.id],
    queryFn: async () => {
      const response = await fetch(`/api/appointments/patient/${patientData?.id}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      return await response.json();
    },
    enabled: !!patientData?.id
  });

  // Fetch patient's prescriptions
  const { data: prescriptions, isLoading: isLoadingPrescriptions } = useQuery({
    queryKey: ["/api/prescriptions/patient", patientData?.id],
    queryFn: async () => {
      const response = await fetch(`/api/prescriptions/patient/${patientData?.id}`);
      if (!response.ok) throw new Error('Failed to fetch prescriptions');
      return await response.json();
    },
    enabled: !!patientData?.id
  });

  // Fetch patient's skin analyses
  const { data: skinAnalyses, isLoading: isLoadingSkinAnalyses } = useQuery({
    queryKey: ["/api/skin-analyses/patient", patientData?.id],
    queryFn: async () => {
      const response = await fetch(`/api/skin-analyses/patient/${patientData?.id}`);
      if (!response.ok) throw new Error('Failed to fetch skin analyses');
      return await response.json();
    },
    enabled: !!patientData?.id
  });

  // Calculate stats for the patient
  const appointmentCount = Array.isArray(appointments) ? appointments.length : 0;
  const upcomingAppointments = Array.isArray(appointments) 
    ? appointments.filter((apt: Appointment) => {
        const today = new Date();
        const aptDate = new Date(apt.date);
        return aptDate >= today && apt.status !== "Cancelled";
      })
    : [];
  const prescriptionCount = Array.isArray(prescriptions) ? prescriptions.length : 0;
  const analysesCount = Array.isArray(skinAnalyses) ? skinAnalyses.length : 0;

  // Prepare appointment columns for the table
  const appointmentColumns = [
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
      header: "Purpose",
      accessor: (row: Appointment) => (
        <div className="text-sm">{row.purpose}</div>
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

  // Prepare skin analysis columns for the table
  const analysisColumns = [
    {
      header: "Date",
      accessor: (row: SkinAnalysis) => {
        const date = row.createdAt || row.date;
        return (
          <div className="text-sm font-medium">
            {date ? formatDate(new Date(date)) : 'Unknown Date'}
          </div>
        );
      },
    },
    {
      header: "Condition",
      accessor: (row: SkinAnalysis) => {
        // Try multiple sources for conditions
        let conditions = "No conditions identified";
        
        if (Array.isArray(row.results) && row.results.length > 0) {
          conditions = row.results.map(r => r.condition).filter(Boolean).join(", ");
        } else if (Array.isArray(row.aiResults) && row.aiResults.length > 0) {
          conditions = row.aiResults.map(r => r.condition).filter(Boolean).join(", ");
        } else if (Array.isArray(row.finalResults) && row.finalResults.length > 0) {
          conditions = row.finalResults.map(r => r.condition).filter(Boolean).join(", ");
        }
        
        return (
          <div className="text-sm">
            {conditions || "Analysis pending"}
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: (row: SkinAnalysis) => {
        const status = row.validationStatus || 'pending';
        let badgeVariant = "secondary";
        if (status === "approved") badgeVariant = "default";
        if (status === "rejected") badgeVariant = "destructive";
        if (status === "pending") badgeVariant = "secondary";
        
        return (
          <Badge variant={badgeVariant as any}>{status}</Badge>
        );
      },
    },
    {
      header: "Actions",
      accessor: (row: SkinAnalysis) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation(`/analysis/${row.id}`)}
        >
          View Results
        </Button>
      ),
    },
  ];

  // Loading state
  if (isLoadingPatient) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state - if patient data isn't available for this user
  if (!patientData && !isLoadingPatient) {
    return (
      <div className="container mx-auto py-8">
        <Card className="mb-6 border-l-4 border-l-warning">
          <CardHeader>
            <CardTitle>Complete Your Patient Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">To access all LUME features, you need to create your patient profile. Please click below to set up your medical information.</p>
            <Button 
              onClick={() => setLocation("/create-profile")} 
              className="bg-primary text-black hover:bg-primary/90"
            >
              Create My Patient Profile
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-primary/20 to-primary/5 border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center py-4">
              <h3 className="text-xl font-bold mb-2">Need help setting up your profile?</h3>
              <p className="text-muted-foreground mb-4 max-w-lg">
                Our medical team can help you complete your profile during your first visit.
                You can also contact us for assistance.
              </p>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Patient Welcome Card */}
      <Card className="mb-8 bg-gradient-to-r from-primary/5 to-black/5 overflow-hidden border-none shadow-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="rounded-full bg-primary/10 p-6 h-24 w-24 flex items-center justify-center">
              {patientData.profileImage ? (
                <img 
                  src={patientData.profileImage} 
                  alt={patientData.name} 
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <User className="h-12 w-12 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome, {patientData.name}</h1>
              <p className="text-lg mb-4">Patient ID: {patientData.pid}</p>
              <p className="text-muted-foreground mb-2">
                Here you can view your appointments, prescriptions, and skin analysis results.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button
                  onClick={() => setLocation("/profile")}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  View My Profile
                </Button>
                <Button
                  onClick={() => setLocation("/skin-analysis")}
                  className="bg-primary text-black hover:bg-primary/90"
                >
                  <Camera className="h-4 w-4 mr-2" /> New Skin Analysis
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Appointments</CardDescription>
            <CardTitle className="text-2xl">{upcomingAppointments.length || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Active Prescriptions</CardDescription>
            <CardTitle className="text-2xl">{prescriptionCount || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <FileText className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Skin Analyses</CardDescription>
            <CardTitle className="text-2xl">{analysesCount || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Activity className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" /> 
            Your Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAppointments ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <DataTable
              columns={appointmentColumns}
              data={upcomingAppointments.slice(0, 5)}
              keyField="id"
              onRowClick={(row) => setLocation(`/appointments/${row.id}`)}
              isLoading={isLoadingAppointments}
            />
          ) : (
            <div className="text-center py-6 bg-muted/20 rounded-lg">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No upcoming appointments</p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => setLocation(`/appointments/new?patientId=${patientData.id}`)}
              >
                Book an Appointment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Calls Section - Hidden for patients, only show upcoming calls */}
      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="h-5 w-5 mr-2 text-primary" /> 
            Video Consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UpcomingVideoCalls patientId={patientData.id} />
        </CardContent>
      </Card>

      {/* Recent Skin Analyses */}
      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" /> 
            Your Skin Analysis History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSkinAnalyses ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : Array.isArray(skinAnalyses) && skinAnalyses.length > 0 ? (
            <DataTable
              columns={analysisColumns}
              data={skinAnalyses.slice(0, 5)}
              keyField="id"
              onRowClick={(row) => setLocation(`/analysis/${row.id}`)}
              isLoading={isLoadingSkinAnalyses}
            />
          ) : (
            <div className="text-center py-6 bg-muted/20 rounded-lg">
              <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No skin analyses yet</p>
              <Button className="mt-4" variant="outline" onClick={() => setLocation("/skin-analysis")}>
                Get Your First Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Download Banner */}
      <Card className="mb-8 overflow-hidden">
        <CardContent className="p-0">
          <AppDownloadLinks variant="banner" />
        </CardContent>
      </Card>

      {/* Footer CTA */}
      <Card className="bg-gradient-to-r from-primary/20 to-primary/5 border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center py-4">
            <h3 className="text-xl font-bold mb-2">Need help or have questions?</h3>
            <p className="text-muted-foreground mb-4 max-w-lg">
              Our medical team is here to assist you with any dermatological concerns.
              Don't hesitate to reach out to us.
            </p>
            <Button variant="default" className="bg-primary text-black hover:bg-primary/90">
              Contact Our Team
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}