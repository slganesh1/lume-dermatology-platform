import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { formatDate, formatTime } from "@/lib/utils";
import { type Appointment, type Patient, type Hospital, type Doctor } from "@shared/schema";
import AppointmentEditForm from "@/components/appointment-edit-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, XCircle, ArrowLeft, Edit, Calendar, Clock, MapPin, User } from "lucide-react";

export default function AppointmentDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const appointmentId = params.id ? parseInt(params.id) : null;
  const isEditMode = window.location.pathname.includes('/edit');

  // Handle case where no appointment ID is provided
  if (!appointmentId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">No appointment selected</p>
            <Button 
              onClick={() => setLocation('/appointments')}
              className="mt-4 mx-auto block"
            >
              Back to Appointments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch appointment data
  const { data: appointment, isLoading: isLoadingAppointment, error: appointmentError } = useQuery<Appointment>({
    queryKey: [`/api/appointments/${appointmentId}`],
    enabled: !!appointmentId,
  });

  // Debug logging
  console.log('AppointmentDetails Debug:', {
    appointmentId,
    appointment,
    isLoadingAppointment,
    appointmentError,
    isEditMode
  });

  // Fetch patient data
  const { data: patient } = useQuery<Patient>({
    queryKey: [`/api/patients/${appointment?.patientId}`],
    enabled: !!appointment?.patientId,
  });

  // Fetch hospital and doctor data
  const { data: hospitals } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
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
      queryClient.invalidateQueries({ queryKey: [`/api/appointments/${appointmentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
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

  const handleApproveAppointment = () => {
    if (appointmentId) {
      updateStatusMutation.mutate({ appointmentId, status: "Confirmed" });
    }
  };

  const handleRejectAppointment = () => {
    if (appointmentId) {
      updateStatusMutation.mutate({ appointmentId, status: "Cancelled" });
    }
  };

  if (isLoadingAppointment) {
    return (
      <div className="py-6 mt-16 md:mt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full"></div>
            <span className="ml-2">Loading appointment...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="py-6 mt-16 md:mt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-10">
            <h3 className="text-lg font-medium text-gray-900">Appointment not found</h3>
            <p className="mt-2 text-sm text-gray-500">
              The appointment you're looking for doesn't exist or has been deleted.
            </p>
            <div className="mt-6">
              <Button onClick={() => setLocation("/appointments")}>
                Back to Appointments
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hospital = hospitals?.find(h => h.id === appointment.hospitalId);
  const doctor = doctors?.find(d => d.id === appointment.doctorId);
  const canApprove = user?.role === "doctor" || user?.role === "admin";
  const isPending = appointment.status.toLowerCase() === "pending";

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isEditMode) {
    return (
      <div className="py-6 mt-16 md:mt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation(`/appointments/${appointmentId}`)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Appointment</h1>
          </div>

          <Card>
            <CardContent className="p-6">
              <AppointmentEditForm
                appointmentId={appointmentId}
                onSuccess={() => setLocation(`/appointments/${appointmentId}`)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 mt-16 md:mt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/appointments")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Appointments
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
              <p className="text-gray-600">View and manage appointment information</p>
            </div>
            
            <div className="flex gap-2">
              {canApprove && isPending && (
                <>
                  <Button
                    onClick={handleApproveAppointment}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={handleRejectAppointment}
                    variant="destructive"
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                onClick={() => setLocation(`/appointments/${appointmentId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Patient Information
              </h3>
              
              {patient ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <p className="text-gray-900">{patient.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Patient ID:</span>
                    <p className="text-gray-900">{patient.pid}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Age:</span>
                    <p className="text-gray-900">{patient.age} years</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Gender:</span>
                    <p className="text-gray-900">{patient.gender}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Phone:</span>
                    <p className="text-gray-900">{patient.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Patient information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Appointment Details
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Date:</span>
                  <p className="text-gray-900">{formatDate(new Date(appointment.date))}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Time:</span>
                  <p className="text-gray-900 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatTime(appointment.time)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <Badge className={`${getStatusColor(appointment.status)} font-medium px-2 py-1 rounded-full text-xs ml-2`}>
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hospital Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Hospital Information
              </h3>
              
              {hospital ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <p className="text-gray-900">{hospital.name}</p>
                  </div>
                  {hospital.address && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Address:</span>
                      <p className="text-gray-900">{hospital.address}</p>
                    </div>
                  )}
                  {hospital.phone && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Phone:</span>
                      <p className="text-gray-900">{hospital.phone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Hospital information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Doctor Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Doctor Information
              </h3>
              
              {doctor ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <p className="text-gray-900">Dr. {doctor.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Specialization:</span>
                    <p className="text-gray-900">{doctor.specialization}</p>
                  </div>
                  {doctor.experience && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Experience:</span>
                      <p className="text-gray-900">{doctor.experience}</p>
                    </div>
                  )}
                  {doctor.phone && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Phone:</span>
                      <p className="text-gray-900">{doctor.phone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Doctor information not available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}