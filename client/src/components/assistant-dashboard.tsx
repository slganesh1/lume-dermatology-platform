import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Activity, Calendar, FileText, Plus, User, Camera, Search, Shield, TrendingUp, Clock, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type Appointment, type Patient } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { AvatarProfile } from "@/components/ui/avatar-profile";

export default function AssistantDashboard() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Get today's date in YYYY-MM-DD format for API
  const today = new Date();
  const todayFormatted = today.toISOString().split('T')[0];

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

  // Calculate stats
  const patientCount = Array.isArray(patients) ? patients.length : 0;
  const todayAppointmentCount = Array.isArray(todayAppointments) ? todayAppointments.length : 0;

  // Appointment Status Count
  const confirmedAppointments = Array.isArray(todayAppointments) 
    ? todayAppointments.filter((apt: Appointment) => apt.status === "Confirmed").length
    : 0;
  
  const pendingAppointments = Array.isArray(todayAppointments) 
    ? todayAppointments.filter((apt: Appointment) => apt.status === "Pending").length
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
              src={patient?.profileImage}
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation(`/appointments/${row.id}`)}
          >
            View
          </Button>
          {row.status === "Pending" && (
            <Button 
              variant="default" 
              size="sm" 
              className="bg-primary text-black hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                // Here you would implement the status update logic
                // For now we just show this is possible
                alert(`Checking in patient ${row.id}`);
              }}
            >
              Check In
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Quick access patients
  const recentPatients = Array.isArray(patients) ? patients.slice(0, 6) : [];

  return (
    <div className="container mx-auto py-8">
      {/* Welcome Card */}
      <Card className="mb-8 bg-gradient-to-r from-primary/10 to-transparent border-none">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-16 w-16 rounded-full flex items-center justify-center bg-primary/20 mr-4">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Welcome, {user?.name?.split(' ')[0]}</h1>
                <p className="text-muted-foreground">Clinic Assistant Dashboard</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setLocation("/appointments/new")}>
                <Calendar className="h-4 w-4 mr-2" /> New Appointment
              </Button>
              <Button onClick={() => setLocation("/patients/new")} variant="outline">
                <User className="h-4 w-4 mr-2" /> New Patient
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Today's Appointments</CardDescription>
            <CardTitle className="text-2xl">{todayAppointmentCount || "0"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-primary" />
              <div className="flex gap-2">
                <Badge variant="success">{confirmedAppointments} Confirmed</Badge>
                {pendingAppointments > 0 && (
                  <Badge variant="warning">{pendingAppointments} Pending</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Total Patients</CardDescription>
            <CardTitle className="text-2xl">{patientCount || "0"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <User className="h-8 w-8 text-primary" />
              <Button variant="outline" size="sm" onClick={() => setLocation("/patients")}>
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Quick Actions</CardDescription>
            <CardTitle className="text-2xl">Reception</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Activity className="h-8 w-8 text-primary" />
              <Button variant="outline" size="sm" onClick={() => setLocation("/appointments")}>
                Check in Patient
              </Button>
            </div>
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
              <p className="text-muted-foreground mb-4">Schedule new appointments or check tomorrow's schedule</p>
              <Button onClick={() => setLocation("/appointments/new")}>
                Schedule New Appointment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Access Section */}
      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" /> 
            Quick Access - Patient Records
          </CardTitle>
          <CardDescription>Quickly access the most recently updated patient records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {isLoadingPatients ? (
              <div className="col-span-full flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentPatients.length > 0 ? (
              recentPatients.map((patient: Patient) => (
                <Card 
                  key={patient.id} 
                  className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/patients/${patient.id}`)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <AvatarProfile
                      src={patient.profileImage}
                      name={patient.name}
                      size="lg"
                      className="mb-3 mt-2"
                    />
                    <h3 className="font-medium text-sm line-clamp-1">{patient.name}</h3>
                    <p className="text-xs text-muted-foreground">PID: {patient.pid}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-6 bg-muted/20 rounded-lg">
                <User className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No patients in the system</p>
                <Button className="mt-4" variant="outline" onClick={() => setLocation("/patients/new")}>
                  Add First Patient
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Main Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" /> 
              Appointment Management
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-48">
            <p className="text-muted-foreground mb-4 flex-grow">
              Manage all clinic appointments, schedule follow-ups, and track patient check-ins.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation("/appointments")} 
                variant="outline" 
                className="w-full"
              >
                View Appointments
              </Button>
              <Button 
                onClick={() => setLocation("/appointments/new")} 
                variant="outline" 
                className="w-full"
                size="sm"
              >
                Create New
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" /> 
              Patient Records
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-48">
            <p className="text-muted-foreground mb-4 flex-grow">
              Access, create and update patient profiles and medical history in the system.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation("/patients")} 
                variant="outline" 
                className="w-full"
              >
                View Patients
              </Button>
              <Button 
                onClick={() => setLocation("/patients/new")} 
                variant="outline" 
                className="w-full"
                size="sm"
              >
                Register New Patient
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/60 to-primary h-2"></div>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" /> 
              Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-48">
            <p className="text-muted-foreground mb-4 flex-grow">
              Issue and manage patient prescriptions and track medication history.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation("/prescriptions")} 
                variant="outline" 
                className="w-full"
              >
                View Prescriptions
              </Button>
              <Button 
                onClick={() => setLocation("/medications")} 
                variant="outline" 
                className="w-full"
                size="sm"
              >
                Medication Inventory
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}