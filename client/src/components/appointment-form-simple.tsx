import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar, Clock, User, Building2, Stethoscope, FileText } from "lucide-react";

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

export default function SimpleAppointmentForm({ onSuccess }: AppointmentFormProps) {
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
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error?.message || "Unable to create appointment. Please try again.",
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
    <div className="space-y-6">
      {/* Patient Info Header */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-amber-600" />
          <div>
            <h3 className="font-semibold text-amber-900">
              {currentPatient?.name || "Patient"}
            </h3>
            <p className="text-sm text-amber-700">
              ID: {currentPatient?.pid} • Age: {currentPatient?.age} • {currentPatient?.gender}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      const hospitalId = Number(value);
                      field.onChange(hospitalId);
                      setSelectedHospitalId(hospitalId);
                      form.setValue("doctorId", 0); // Reset doctor selection
                    }}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a hospital" />
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
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString() || ""}
                    disabled={!selectedHospitalId || doctorsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedHospitalId 
                            ? "Select hospital first" 
                            : doctorsLoading 
                            ? "Loading doctors..." 
                            : "Choose a doctor"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors?.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">Dr. {doctor.name}</span>
                            <span className="text-sm text-gray-500">{doctor.specialization}</span>
                            {doctor.experience && (
                              <span className="text-xs text-gray-400">{doctor.experience}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Appointment Date
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
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
                    Preferred Time
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem 
                          key={slot.value} 
                          value={slot.value}
                          disabled={!slot.available}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{slot.label}</span>
                            {!slot.available && (
                              <span className="text-xs text-red-500 ml-2">Booked</span>
                            )}
                          </div>
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
              onClick={onSuccess}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </>
              ) : (
                "Schedule Appointment"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}