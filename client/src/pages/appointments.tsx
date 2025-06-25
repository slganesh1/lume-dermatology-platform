import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { DataTable } from "@/components/ui/data-table";
import { AvatarProfile } from "@/components/ui/avatar-profile";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { formatDate, formatTime } from "@/lib/utils";
import { type Appointment, type Patient, type Hospital, type Doctor } from "@shared/schema";
import SimpleAppointmentForm from "@/components/appointment-form-simple";
import AppointmentForm from "@/components/appointment-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, XCircle, Eye, Edit } from "lucide-react";

export default function Appointments() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Check if we're in a specific appointment view mode
  const appointmentId = params.id ? parseInt(params.id) : null;
  const isEditMode = location.includes('/edit');
  const isDetailView = appointmentId && !isEditMode;

  // Extract patientId from query params if passed in URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlPatientId = urlParams.get("patientId");

  // Fetch appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["/api/appointments"],
  });

  // Fetch patients
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/patients"],
  });

  // Fetch hospitals and doctors for detailed view
  const { data: hospitals } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  // Fetch specific appointment if viewing/editing
  const { data: currentAppointment, isLoading: isLoadingAppointment } = useQuery<Appointment>({
    queryKey: [`/api/appointments/${appointmentId}`],
    enabled: !!appointmentId,
  });

  // Appointment status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/appointments/${appointmentId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/appointments/${appointmentId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Filter appointments based on selected date and search term
  const filteredAppointments = Array.isArray(appointments)
    ? appointments.filter((appointment: Appointment) => {
        const matchesDate = selectedDate
          ? new Date(appointment.date).toDateString() === selectedDate.toDateString()
          : true;
        
        const patient = Array.isArray(patients)
          ? patients.find((p: Patient) => p.id === appointment.patientId)
          : undefined;
        
        const matchesSearch = searchTerm
          ? patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient?.pid.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        
        return matchesDate && matchesSearch;
      })
    : [];

  // Handle row click
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  // Handle new appointment click
  const handleAddAppointment = () => {
    setShowAddAppointment(true);
  };

  // Table columns
  const columns = [
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
      header: "Time",
      accessor: (row: Appointment) => (
        <div>
          <div className="text-sm text-gray-900">{formatTime(row.time)}</div>
          <div className="text-sm text-gray-500">
            {formatDate(row.date) === formatDate(new Date()) ? "Today" : formatDate(row.date)}
          </div>
        </div>
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
      accessor: (row: Appointment) => {
        const canApprove = user?.role === "doctor" || user?.role === "admin";
        const isPending = row.status.toLowerCase() === "pending";
        
        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/appointments/${row.id}`);
              }}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/appointments/${row.id}/edit`);
              }}
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
            {canApprove && isPending && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatusMutation.mutate({ appointmentId: row.id, status: "Confirmed" });
                  }}
                  className="flex items-center gap-1 text-green-600 hover:text-green-700"
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="h-3 w-3" />
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatusMutation.mutate({ appointmentId: row.id, status: "Cancelled" });
                  }}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="h-3 w-3" />
                  Reject
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="py-6 mt-16 md:mt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
          <p className="text-gray-600">Manage and schedule patient appointments</p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="search"
              placeholder="Search appointments..."
              className="w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            className="bg-amber-400 hover:bg-amber-500 text-black"
            onClick={handleAddAppointment}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            New Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Calendar */}
        <div className="md:col-span-1">
          <Card className="h-full border border-gray-200">
            <CardContent className="p-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Select Date</h2>
              </div>
              
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
              />
              
              <div className="mt-4 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className="text-sm"
                >
                  Today
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center text-sm"
                    >
                      <span>Filter</span>
                      <svg
                        className="w-4 h-4 ml-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </Button>
                  </PopoverTrigger>
                  
                  <PopoverContent className="w-[200px] p-0 z-50" align="end">
                    <div className="p-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-left"
                        onClick={() => setSelectedDate(undefined)}
                      >
                        All Appointments
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-left"
                        onClick={() => {
                          const today = new Date();
                          setSelectedDate(today);
                        }}
                      >
                        Today
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-left"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setSelectedDate(tomorrow);
                        }}
                      >
                        Tomorrow
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-left"
                        onClick={() => {
                          const nextWeek = new Date();
                          nextWeek.setDate(nextWeek.getDate() + 7);
                          setSelectedDate(nextWeek);
                        }}
                      >
                        Next Week
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <div className="md:col-span-3">
          <Card className="border border-gray-200">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedDate
                  ? `Appointments for ${formatDate(selectedDate)}`
                  : "All Appointments"}
              </h2>
            </div>
            <CardContent className="p-6">
              <DataTable
                data={filteredAppointments}
                columns={columns}
                keyField="id"
                onRowClick={handleAppointmentClick}
                isLoading={isLoadingAppointments || isLoadingPatients}
                emptyState={
                  <div className="text-center py-10">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-300"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <h3 className="mt-4 text-base font-medium text-gray-900">No appointments found</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {selectedDate
                        ? `No appointments scheduled for ${formatDate(selectedDate)}`
                        : "No appointments match your search criteria"}
                    </p>
                    <div className="mt-6">
                      <Button 
                        onClick={handleAddAppointment}
                        className="bg-amber-400 hover:bg-amber-500 text-black"
                      >
                        <svg
                          className="mr-2 h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Schedule Appointment
                      </Button>
                    </div>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Appointment Dialog */}
      <Dialog open={showAddAppointment} onOpenChange={setShowAddAppointment}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
          </DialogHeader>
          <SimpleAppointmentForm 
            onSuccess={() => setShowAddAppointment(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* View/Edit Appointment Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <AppointmentForm 
              appointmentId={selectedAppointment.id}
              onSuccess={() => setSelectedAppointment(null)} 
              viewOnly={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}