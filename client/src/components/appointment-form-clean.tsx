import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Patient, type Hospital, type Doctor } from "@shared/schema";
import { Calendar, Clock, User, Building2, Stethoscope } from "lucide-react";

interface AppointmentFormProps {
  onSuccess?: () => void;
}

const formSchema = z.object({
  patientId: z.number(),
  hospitalId: z.number({ required_error: "Please select a hospital" }),
  doctorId: z.number({ required_error: "Please select a doctor" }),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time"),
  status: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const timeSlots = [
  { value: "09:00:00", label: "9:00 AM", available: true },
  { value: "09:30:00", label: "9:30 AM", available: true },
  { value: "10:00:00", label: "10:00 AM", available: true },
  { value: "10:30:00", label: "10:30 AM", available: true },
  { value: "11:00:00", label: "11:00 AM", available: true },
  { value: "11:30:00", label: "11:30 AM", available: true },
  { value: "14:00:00", label: "2:00 PM", available: true },
  { value: "14:30:00", label: "2:30 PM", available: true },
  { value: "15:00:00", label: "3:00 PM", available: true },
  { value: "15:30:00", label: "3:30 PM", available: true },
  { value: "16:00:00", label: "4:00 PM", available: true },
  { value: "16:30:00", label: "4:30 PM", available: true },
];

export default function CleanAppointmentForm({ onSuccess }: AppointmentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedHospitalId, setSelectedHospitalId] = useState<number>();

  // Fetch data
  const { data: hospitals, isLoading: hospitalsLoading } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const { data: currentPatient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: doctors, isLoading: doctorsLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors", selectedHospitalId],
    enabled: !!selectedHospitalId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: 0,
      hospitalId: 0,
      doctorId: 0,
      date: new Date().toISOString().split('T')[0],
      time: "",
      status: "Pending",
    },
  });

  // Update patientId when currentPatient is loaded
  const watchedPatientId = form.watch("patientId");
  if (currentPatient?.id && watchedPatientId === 0) {
    form.setValue("patientId", currentPatient.id);
  }

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/appointments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Scheduled",
        description: "Your appointment has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  if (patientLoading || hospitalsLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Appointment</h2>
        <p className="text-gray-600">Book your consultation with our medical experts</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient Info Display */}
          {currentPatient && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <User className="h-5 w-5" />
                <span className="font-medium">Patient: {currentPatient.name}</span>
              </div>
            </div>
          )}

          {/* Hospital Selection */}
          <FormField
            control={form.control}
            name="hospitalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Hospital
                </FormLabel>
                <Select 
                  onValueChange={(value) => {
                    const hospitalId = parseInt(value);
                    field.onChange(hospitalId);
                    setSelectedHospitalId(hospitalId);
                    form.setValue("doctorId", 0); // Reset doctor selection
                  }} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a hospital" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {hospitals?.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{hospital.name}</span>
                          <span className="text-sm text-gray-500">{hospital.address}</span>
                        </div>
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
                <FormLabel className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Doctor
                </FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  value={field.value?.toString()}
                  disabled={!selectedHospitalId || doctorsLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedHospitalId ? "Select a doctor" : "Select hospital first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors?.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{doctor.name}</span>
                          <span className="text-sm text-gray-500">{doctor.specialization}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      {...field}
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
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem 
                          key={slot.value} 
                          value={slot.value}
                          disabled={!slot.available}
                        >
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Booking...
                </>
              ) : (
                "Book Appointment"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}