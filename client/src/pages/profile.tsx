import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarProfile } from "@/components/ui/avatar-profile";
import { PageHeader } from "@/components/ui/page-header";
import { ValidationResults } from "@/components/validation-results-fixed";
import { Loader2, User, CalendarDays, FileText, Pill, Activity, ArrowLeft, LogOut } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Patient, 
  Appointment,
  Prescription,
  SkinAnalysis 
} from "@shared/schema";

export default function ProfilePage() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");

  // Handle URL parameters for direct tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['personal', 'appointments', 'prescriptions', 'analyses'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  const handleForceLogout = async () => {
    try {
      await fetch('/api/force-logout', { method: 'POST' });
      logoutMutation.mutate();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Force logout failed:', error);
    }
  };

  // Fetch the patient data for the current user
  const { data: patientData, isLoading: isLoadingPatient } = useQuery<Patient>({
    queryKey: [`/api/patients/user/${user?.id}`],
    enabled: !!user,
  });

  // Safely access patient ID with fallback
  const patientId = patientData?.id;

  // Fetch additional patient data if patient record exists
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: [`/api/appointments/patient/${patientId}`],
    enabled: !!patientId,
  });

  const { data: prescriptions = [], isLoading: isLoadingPrescriptions } = useQuery<Prescription[]>({
    queryKey: [`/api/prescriptions/patient/${patientId}`],
    enabled: !!patientId,
  });

  const { data: skinAnalyses = [], isLoading: isLoadingSkinAnalyses } = useQuery<SkinAnalysis[]>({
    queryKey: [`/api/skin-analyses/patient/${patientId}`],
    enabled: !!patientId,
    staleTime: 300000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isLoadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="max-w-3xl mx-auto mt-8">
        <PageHeader
          heading="Profile Not Found"
          subheading="We couldn't find your patient profile. Please contact support or your doctor for assistance."
          actions={
            <Button onClick={() => setLocation("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
            </Button>
          }
        />
        
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center p-8">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Patient Record</h3>
              <p className="text-muted-foreground mb-4">
                Your user account exists, but there's no linked patient record in our system.
              </p>
              <Button onClick={() => setLocation("/")}>Return to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 pb-16">
      <PageHeader
        heading="My Profile"
        subheading="View and manage your personal medical information."
        actions={
          <Button onClick={() => setLocation("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Dashboard
          </Button>
        }
      />
      
      <div className="mt-8">
        <Card className="border-none shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 h-32 flex items-end p-6">
            <div className="relative">
              <div className="absolute -bottom-16 bg-white p-2 rounded-full">
                <AvatarProfile
                  src={patientData.profileImage}
                  name={patientData.name}
                  size="xl"
                />
              </div>
            </div>
          </div>
          
          <CardContent className="pt-20 px-6">
            <div className="flex items-start justify-between flex-wrap">
              <div>
                <h2 className="text-2xl font-bold">{patientData.name}</h2>
                <div className="flex items-center mt-1 space-x-2">
                  <Badge variant="outline" className="text-xs font-normal">
                    PID: {patientData.pid}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {patientData.age} years • {patientData.gender}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="personal" className="mt-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="analyses">Skin Analyses</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1">{patientData.email || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1">{patientData.contact || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="mt-1">{patientData.address || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">User ID</p>
                    <p className="mt-1">{patientData.userId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Allergies</p>
                    <p className="mt-1">{patientData.allergies || "None reported"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Blood Type</p>
                    <p className="mt-1">{patientData.bloodType || "Not recorded"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Visit Date</p>
                    <p className="mt-1">
                      {patientData.lastVisitDate ? formatDate(new Date(patientData.lastVisitDate)) : "No previous visits"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Next Visit Date</p>
                    <p className="mt-1">
                      {patientData.nextVisitDate ? formatDate(new Date(patientData.nextVisitDate)) : "No scheduled visits"}
                    </p>
                  </div>
                </div>
                {patientData.issueSummary && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Health Summary</p>
                    <p className="mt-1">{patientData.issueSummary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appointments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">My Appointments</CardTitle>
                <Button 
                  onClick={() => setLocation("/appointments/new")} 
                  size="sm"
                >
                  Book Appointment
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingAppointments ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p>Loading appointments...</p>
                  </div>
                ) : appointments && appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-start border rounded-lg p-4">
                        <div className="bg-primary/10 p-3 rounded-full mr-4">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{formatDate(new Date(appointment.date))}</h4>
                              <p className="text-sm text-muted-foreground">
                                {appointment.time} • General Checkup
                              </p>
                            </div>
                            <Badge 
                              variant={
                                appointment.status === "confirmed" ? "default" : 
                                appointment.status === "cancelled" ? "destructive" : 
                                "outline"
                              }
                            >
                              {appointment.status || "Scheduled"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg">
                    <CalendarDays className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <h3 className="text-lg font-medium mb-1">No Appointments</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You don't have any scheduled appointments.
                    </p>
                    <Button onClick={() => setLocation("/appointments/new")}>
                      Book Your First Appointment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">My Prescriptions</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPrescriptions ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p>Loading prescriptions...</p>
                  </div>
                ) : prescriptions && prescriptions.length > 0 ? (
                  <div className="space-y-4">
                    {prescriptions.map((prescription) => (
                      <div key={prescription.id} className="flex items-start border rounded-lg p-4">
                        <div className="bg-primary/10 p-3 rounded-full mr-4">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">Prescription #{prescription.id}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(new Date(prescription.date))}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">View Details</Button>
                          </div>
                          {prescription.medications && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm font-medium mb-2">Medications:</p>
                              <div className="space-y-2">
                                {prescription.medications.split(',').map((med, idx) => (
                                  <div key={idx} className="flex items-center">
                                    <Pill className="h-3 w-3 mr-2 text-primary" />
                                    <span className="text-sm">{med.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {prescription.instructions && (
                            <p className="text-sm mt-2">{prescription.instructions}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <h3 className="text-lg font-medium mb-1">No Prescriptions</h3>
                    <p className="text-sm text-muted-foreground">
                      You don't have any prescriptions in our records.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analyses">
            <ValidationResults />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}