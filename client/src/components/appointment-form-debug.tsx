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
import { insertAppointmentSchema, type Appointment, type Patient, type Hospital, type Doctor } from "@shared/schema";

interface AppointmentFormProps {
  appointmentId?: number;
  initialPatientId?: number;
  initialDate?: Date;
  onSuccess?: () => void;
  viewOnly?: boolean;
}

// Simple form schema for debugging
const formSchema = z.object({
  patientId: z.number().min(1, "Patient is required"),
  hospitalId: z.number().min(1, "Hospital is required"),
  doctorId: z.number().min(1, "Doctor is required"),
  date: z.date(),
  time: z.string().min(1, "Time is required"),
  type: z.string().min(1, "Type is required"),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AppointmentFormDebug({
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

  console.log("AppointmentFormDebug rendering", { user, isPatient, appointmentId });

  // Fetch hospitals for dropdown
  const { data: hospitals, isLoading: isLoadingHospitals, error: hospitalsError } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  console.log("Hospitals query:", { hospitals, isLoadingHospitals, hospitalsError });

  // Fetch patients for dropdown
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch current user's patient data if user is a patient
  const { data: currentPatient } = useQuery<Patient>({
    queryKey: [`/api/patients/user/${user?.id}`],
    enabled: isPatient && !!user?.id,
  });

  console.log("Current patient:", currentPatient);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: initialPatientId || (isPatient ? currentPatient?.id : undefined),
      hospitalId: undefined,
      doctorId: undefined,
      date: initialDate || new Date(),
      time: "09:00:00",
      type: "Consultation",
      duration: 30,
      status: "Pending",
      notes: "",
    },
  });

  // Update form when patient data loads
  useEffect(() => {
    if (isPatient && currentPatient && !form.getValues("patientId")) {
      form.setValue("patientId", currentPatient.id);
    }
  }, [currentPatient, isPatient, form]);

  // Fetch doctors based on selected hospital
  const selectedHospitalId = form.watch("hospitalId");
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors", selectedHospitalId],
    enabled: !!selectedHospitalId,
  });

  console.log("Doctors query:", { selectedHospitalId, doctors, isLoadingDoctors });

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Creating appointment with data:", data);
      const response = await apiRequest("POST", "/api/appointments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Create appointment error:", error);
      toast({
        title: "Error",
        description: "Failed to create appointment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted with data:", data);
    
    // For patients creating a new appointment, always set duration to 30 minutes
    // and ensure status is "Pending"
    if (!isEditMode && isPatient) {
      data.duration = 30;
      data.status = "Pending";
    }
    
    createMutation.mutate(data);
  };

  console.log("Form errors:", form.formState.errors);

  if (isLoadingHospitals || isLoadingPatients) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (hospitalsError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-600">Error loading hospitals. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-medium">Debug Info:</h3>
        <p>User: {user?.username} ({user?.role})</p>
        <p>Hospitals loaded: {hospitals?.length || 0}</p>
        <p>Patients loaded: {patients?.length || 0}</p>
        <p>Current patient: {currentPatient?.name || "None"}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient Selection */}
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <FormControl>
                  {isPatient ? (
                    <Input 
                      value={currentPatient?.name || "Loading..."} 
                      disabled 
                    />
                  ) : (
                    <Select
                      disabled={isLoadingPatients}
                      onValueChange={(value) => field.onChange(parseInt(value))}
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

          {/* Hospital Selection */}
          <FormField
            control={form.control}
            name="hospitalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hospital</FormLabel>
                <FormControl>
                  <Select
                    disabled={isLoadingHospitals}
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                      // Reset doctor selection when hospital changes
                      form.setValue("doctorId", undefined);
                    }}
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

          {/* Doctor Selection */}
          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor</FormLabel>
                <FormControl>
                  <Select
                    disabled={!selectedHospitalId || isLoadingDoctors}
                    onValueChange={(value) => field.onChange(parseInt(value))}
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

          {/* Simple Date Input */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Selection */}
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00:00">9:00 AM</SelectItem>
                      <SelectItem value="10:00:00">10:00 AM</SelectItem>
                      <SelectItem value="11:00:00">11:00 AM</SelectItem>
                      <SelectItem value="14:00:00">2:00 PM</SelectItem>
                      <SelectItem value="15:00:00">3:00 PM</SelectItem>
                      <SelectItem value="16:00:00">4:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Type Selection */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appointment Type</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Check-up">Check-up</SelectItem>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Treatment">Treatment</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}