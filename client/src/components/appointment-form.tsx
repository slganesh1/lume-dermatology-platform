import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatTime } from "@/lib/utils";
import { insertAppointmentSchema, type Appointment, type Patient, type Hospital, type Doctor } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AppointmentFormProps {
  appointmentId?: number;
  initialPatientId?: number;
  initialDate?: Date;
  onSuccess?: () => void;
  viewOnly?: boolean;
}

// Extend the insert schema with additional validation
const formSchema = z.object({
  patientId: z.number({
    required_error: "Patient is required",
    invalid_type_error: "Patient is required",
  }),
  hospitalId: z.number({
    required_error: "Hospital is required",
    invalid_type_error: "Hospital is required",
  }).optional(),
  doctorId: z.number({
    required_error: "Doctor is required",
    invalid_type_error: "Doctor is required",
  }).optional(),
  date: z.date({
    required_error: "Date is required",
    invalid_type_error: "Date is required",
  }),
  time: z.string().min(1, {
    message: "Time is required",
  }),
  status: z.string().min(1, {
    message: "Status is required",
  }),
}).refine((data) => data.hospitalId !== undefined, {
  message: "Hospital is required",
  path: ["hospitalId"],
}).refine((data) => data.doctorId !== undefined, {
  message: "Doctor is required",
  path: ["doctorId"],
});

type FormValues = z.infer<typeof formSchema>;

const availableTimes = [
  "09:00:00", "09:30:00", "10:00:00", "10:30:00", "11:00:00", "11:30:00",
  "13:00:00", "13:30:00", "14:00:00", "14:30:00", "15:00:00", "15:30:00",
  "16:00:00", "16:30:00", "17:00:00"
];

export default function AppointmentForm({
  appointmentId,
  initialPatientId,
  initialDate,
  onSuccess,
  viewOnly = false,
}: AppointmentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!appointmentId;
  const isPatient = user?.role === "patient";
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);

  // Fetch appointment data if in edit mode
  const { data: appointment, isLoading: isLoadingAppointment, error: appointmentError } = useQuery<Appointment>({
    queryKey: [`/api/appointments/${appointmentId}`],
    enabled: !!appointmentId,
  });

  // Debug logging for appointment loading
  console.log('AppointmentForm Debug:', {
    appointmentId,
    isEditMode,
    appointment,
    isLoadingAppointment,
    appointmentError
  });

  // Fetch patients for dropdown
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch current user's patient data if user is a patient
  const { data: currentPatient } = useQuery<Patient>({
    queryKey: [`/api/patients/user/${user?.id}`],
    enabled: isPatient && !!user?.id,
  });

  // Fetch hospitals for dropdown
  const { data: hospitals, isLoading: isLoadingHospitals } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  // Define form first
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: initialPatientId,
      hospitalId: undefined,
      doctorId: undefined,
      date: initialDate || new Date(),
      time: "09:00:00",
      status: "Pending",
    },
  });

  // Fetch doctors based on selected hospital
  const selectedHospitalId = form.watch("hospitalId");
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors", selectedHospitalId],
    enabled: !!selectedHospitalId,
  });

  // Update form values when appointment data is loaded
  useEffect(() => {
    if (appointment) {
      const appointmentDate = new Date(appointment.date);
      setSelectedDate(appointmentDate);
      
      form.reset({
        patientId: appointment.patientId,
        hospitalId: appointment.hospitalId,
        doctorId: appointment.doctorId,
        date: appointmentDate,
        time: appointment.time,
        status: appointment.status,
      });
    }
  }, [appointment, form]);

  // Auto-populate patient ID for patient users
  useEffect(() => {
    if (currentPatient && isPatient && !appointmentId) {
      form.setValue("patientId", currentPatient.id);
    }
  }, [currentPatient, isPatient, appointmentId, form]);

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Add type as "consultation" and format the data
      const appointmentData = {
        ...data,
        type: "consultation",
        date: data.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      };
      const response = await apiRequest("POST", "/api/appointments", appointmentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create appointment",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Update appointment mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("PUT", `/api/appointments/${appointmentId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/appointments/${appointmentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const onSubmit = (data: FormValues) => {
    // For patients creating a new appointment, ensure status is "Pending"
    if (!isEditMode && isPatient) {
      data.status = "Pending";
    }
    
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if ((isEditMode || viewOnly) && isLoadingAppointment) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        <p className="ml-4">Loading appointment...</p>
      </div>
    );
  }

  if ((isEditMode || viewOnly) && appointmentError) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <p className="text-red-500">Error loading appointment: {appointmentError.message}</p>
          <Button onClick={onSuccess} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  if ((isEditMode || viewOnly) && !appointment && !isLoadingAppointment) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <p className="text-gray-500">Appointment not found</p>
          <Button onClick={onSuccess} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const findPatientName = (id: number): string => {
    if (!Array.isArray(patients)) return "Loading...";
    
    const patient = patients.find(p => p.id === id);
    return patient ? patient.name : "Unknown Patient";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient</FormLabel>
              <FormControl>
                {viewOnly ? (
                  <Input 
                    value={findPatientName(field.value as number)} 
                    disabled 
                  />
                ) : isPatient ? (
                  <Input 
                    value={currentPatient?.name || "Loading..."} 
                    disabled 
                  />
                ) : (
                  <Select
                    disabled={isLoadingPatients || viewOnly}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                    value={field.value?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(patients) ? (
                        patients.map((patient) => (
                          <SelectItem
                            key={patient.id}
                            value={patient.id.toString()}
                          >
                            {patient.name} (PID: {patient.pid})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Loading patients...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hospitalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hospital</FormLabel>
              <FormControl>
                <Select
                  disabled={isLoadingHospitals || viewOnly}
                  onValueChange={(value) => {
                    field.onChange(parseInt(value));
                    // Reset doctor selection when hospital changes
                    form.setValue("doctorId", undefined as any);
                  }}
                  defaultValue={field.value?.toString()}
                  value={field.value?.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(hospitals) ? (
                      hospitals.map((hospital) => (
                        <SelectItem
                          key={hospital.id}
                          value={hospital.id.toString()}
                        >
                          {hospital.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        Loading hospitals...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="doctorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor</FormLabel>
              <FormControl>
                <Select
                  disabled={!selectedHospitalId || isLoadingDoctors || viewOnly}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                  value={field.value?.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedHospitalId ? (
                      Array.isArray(doctors) ? (
                        doctors.map((doctor) => (
                          <SelectItem
                            key={doctor.id}
                            value={doctor.id.toString()}
                          >
                            Dr. {doctor.name} - {doctor.specialization}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Loading doctors...
                        </SelectItem>
                      )
                    ) : (
                      <SelectItem value="" disabled>
                        Please select a hospital first
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={viewOnly}
                      >
                        {field.value ? (
                          formatDate(field.value)
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <svg
                          className="ml-auto h-4 w-4 opacity-50"
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
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setSelectedDate(date);
                      }}
                      disabled={viewOnly}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  {viewOnly ? (
                    <Input 
                      value={formatTime(field.value)} 
                      disabled 
                    />
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={viewOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimes.map((time) => (
                          <SelectItem key={time} value={time}>
                            {formatTime(time)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Purpose field removed as it doesn't exist in the appointment schema */}



        {/* Status field - hidden for patients creating appointments */}
        {(!isPatient || isEditMode || viewOnly) && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  {viewOnly || (!isEditMode && isPatient) ? (
                    <Input 
                      value={field.value} 
                      disabled 
                    />
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={viewOnly || (!isEditMode && isPatient)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Checked In">Checked In</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!viewOnly && (
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                if (onSuccess) onSuccess();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Update Appointment"
              ) : (
                "Create Appointment"
              )}
            </Button>
          </div>
        )}

        {viewOnly && (
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={onSuccess}
            >
              Close
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
