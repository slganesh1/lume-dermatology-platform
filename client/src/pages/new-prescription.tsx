import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Medication, Patient, prescriptionItemSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Copy, Plus, Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/ui/page-header";

// Form schema
const prescriptionFormSchema = z.object({
  patientId: z.string().min(1, { message: "Please select a patient" }),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  endDate: z.date({
    required_error: "Please select an end date",
  }).optional(),
  notes: z.string().optional(),
  medications: z.array(
    z.object({
      medicationId: z.string().min(1, { message: "Please select a medication" }),
      dosage: z.string().min(1, { message: "Please enter a dosage" }),
      frequency: z.string().min(1, { message: "Please enter a frequency" }),
      instructions: z.string().optional(),
      morning: z.boolean().default(false),
      afternoon: z.boolean().default(false),
      evening: z.boolean().default(false),
      beforeFood: z.boolean().default(false),
    })
  ).min(1, { message: "Please add at least one medication" }),
});

type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

export default function NewPrescription() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch patients
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    staleTime: 10000,
  });

  // Fetch medications
  const { data: medications = [], isLoading: isLoadingMedications } = useQuery<Medication[]>({
    queryKey: ['/api/medications'],
    staleTime: 10000,
  });

  // Default form values
  const defaultValues: PrescriptionFormValues = {
    patientId: "",
    startDate: new Date(),
    notes: "",
    medications: [
      {
        medicationId: "",
        dosage: "",
        frequency: "Daily",
        instructions: "",
        morning: true,
        afternoon: false,
        evening: false,
        beforeFood: true,
      },
    ],
  };

  // Setup form
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues,
  });

  // Setup field array for medications
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  // Mutation for creating a prescription
  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/prescriptions", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate prescriptions cache to reload data
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      
      toast({
        title: "Prescription created",
        description: "The prescription has been created successfully.",
      });
      
      setLocation("/prescriptions");
    },
    onError: (error: any) => {
      console.error("Error creating prescription:", error);
      toast({
        title: "Error",
        description: "Failed to create prescription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: PrescriptionFormValues) => {
    // Transform the form data to match the API expectations
    const transformedData = {
      patientId: parseInt(data.patientId),
      date: data.startDate.toISOString(),
      remarks: data.notes || undefined,
      items: data.medications.map(med => {
        // Find medication name from the medications array
        const medication = medications.find(m => m.id.toString() === med.medicationId);
        
        return {
          medicationId: parseInt(med.medicationId),
          medicationName: medication ? medication.name : "",
          dosage: med.dosage,
          morning: med.morning,
          afternoon: med.afternoon,
          night: med.evening, // Map evening to night to match the schema
          remarks: med.instructions || undefined,
        };
      }),
    };

    createPrescriptionMutation.mutate(transformedData);
  };

  // Add a new empty medication to the form
  const addMedication = () => {
    append({
      medicationId: "",
      dosage: "",
      frequency: "Daily",
      instructions: "",
      morning: true,
      afternoon: false,
      evening: false,
      beforeFood: true,
    });
  };

  // Copy a medication
  const duplicateMedication = (index: number) => {
    const medicationToCopy = form.getValues(`medications.${index}`);
    append({ ...medicationToCopy });
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="New Prescription"
        description="Create a new prescription for a patient"
        backButton={{
          label: "Back to Prescriptions",
          onClick: () => setLocation("/prescriptions"),
        }}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Prescription Details</CardTitle>
          <CardDescription>
            Fill out the information below to create a new prescription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Selection */}
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoadingPatients}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients.map(patient => (
                            <SelectItem key={patient.id} value={patient.id.toString()}>
                              {patient.name} ({patient.pid})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional notes or instructions"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Medications Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Medications</h3>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={addMedication}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Medication
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-400 to-teal-500 h-1"></div>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Medication #{index + 1}</h4>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => duplicateMedication(index)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => remove(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Medication Selection */}
                        <FormField
                          control={form.control}
                          name={`medications.${index}.medicationId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Medication</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={isLoadingMedications}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a medication" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {medications.map(medication => (
                                    <SelectItem key={medication.id} value={medication.id.toString()}>
                                      {medication.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Dosage */}
                        <FormField
                          control={form.control}
                          name={`medications.${index}.dosage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dosage</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 10mg, 1 tablet" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Frequency */}
                        <FormField
                          control={form.control}
                          name={`medications.${index}.frequency`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Frequency</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Daily">Daily</SelectItem>
                                  <SelectItem value="Twice Daily">Twice Daily</SelectItem>
                                  <SelectItem value="Three Times Daily">Three Times Daily</SelectItem>
                                  <SelectItem value="Four Times Daily">Four Times Daily</SelectItem>
                                  <SelectItem value="Weekly">Weekly</SelectItem>
                                  <SelectItem value="As Needed">As Needed</SelectItem>
                                  <SelectItem value="Every Other Day">Every Other Day</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Instructions */}
                        <FormField
                          control={form.control}
                          name={`medications.${index}.instructions`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Instructions</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Take with food" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Timing and Food Relation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <FormItem className="space-y-2">
                          <FormLabel>Timing</FormLabel>
                          <div className="flex flex-wrap gap-4">
                            <FormField
                              control={form.control}
                              name={`medications.${index}.morning`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Morning
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`medications.${index}.afternoon`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Afternoon
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`medications.${index}.evening`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Evening
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </FormItem>

                        <FormField
                          control={form.control}
                          name={`medications.${index}.beforeFood`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-2 space-y-0 pt-8">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-normal">
                                  Take before food
                                </FormLabel>
                                <FormDescription>
                                  Medication should be taken on an empty stomach
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/prescriptions")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPrescriptionMutation.isPending}>
                  {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}