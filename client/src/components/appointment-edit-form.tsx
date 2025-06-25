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
import { type Appointment, type Patient, type Hospital, type Doctor } from "@shared/schema";

interface AppointmentEditFormProps {
  appointmentId: number;
  onSuccess?: () => void;
}

const formSchema = z.object({
  patientId: z.number(),
  hospitalId: z.number(),
  doctorId: z.number(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  status: z.string().min(1, "Status is required"),
});

type FormValues = z.infer<typeof formSchema>;

const timeSlots = [
  "09:00:00", "09:30:00", "10:00:00", "10:30:00", "11:00:00", "11:30:00",
  "14:00:00", "14:30:00", "15:00:00", "15:30:00", "16:00:00", "16:30:00"
];

export default function AppointmentEditForm({ appointmentId, onSuccess }: AppointmentEditFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedHospitalId, setSelectedHospitalId] = useState<number>();
  
  // Check if user can edit status (only doctors and admins)
  const canEditStatus = user?.role === "doctor" || user?.role === "admin";

  // Fetch appointment data
  const { data: appointment, isLoading: appointmentLoading, error: appointmentError } = useQuery<Appointment>({
    queryKey: [`/api/appointments/${appointmentId}`],
    enabled: !!appointmentId,
  });

  // Fetch other data
  const { data: hospitals } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors", selectedHospitalId],
    enabled: !!selectedHospitalId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: 0,
      hospitalId: 0,
      doctorId: 0,
      date: "",
      time: "",
      status: "Pending",
    },
  });

  // Update form when appointment loads
  useEffect(() => {
    if (appointment) {
      setSelectedHospitalId(appointment.hospitalId);
      form.reset({
        patientId: appointment.patientId,
        hospitalId: appointment.hospitalId,
        doctorId: appointment.doctorId,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
      });
    }
  }, [appointment, form]);

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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data);
  };

  if (appointmentLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="ml-4">Loading appointment...</p>
      </div>
    );
  }

  if (appointmentError) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading appointment</p>
          <Button onClick={onSuccess}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Appointment not found</p>
          <Button onClick={onSuccess}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient Selection */}
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients?.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.name} - {patient.pid}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select 
                  onValueChange={(value) => {
                    const hospitalId = parseInt(value);
                    field.onChange(hospitalId);
                    setSelectedHospitalId(hospitalId);
                    form.setValue("doctorId", 0);
                  }} 
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {hospitals?.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id.toString()}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  value={field.value.toString()}
                  disabled={!selectedHospitalId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors?.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.name} - {doctor.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time */}
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Status - Only doctors can edit */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                {canEditStatus ? (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="Checked In">Checked In</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input 
                      value={field.value} 
                      disabled 
                      className="bg-gray-100 text-gray-600"
                    />
                  </FormControl>
                )}
                {!canEditStatus && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Only doctors can change appointment status
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSuccess}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? "Updating..." : "Update Appointment"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}