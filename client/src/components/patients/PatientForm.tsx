import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPatientSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Extend the patient schema with validation rules
const formSchema = insertPatientSchema.extend({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  age: z.coerce.number().min(0, "Age must be positive").max(120, "Age must be less than 120"),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
  contact: z.string().min(5, "Contact must be at least 5 characters"),
});

interface PatientFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  patientId?: number; // Optional: for editing existing patient
}

export function PatientForm({ onCancel, onSuccess, patientId }: PatientFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      age: 0,
      gender: undefined,
      contact: "",
      allergies: "",
      pid: `P${Math.floor(1000 + Math.random() * 9000)}`, // Generate a random PID
      photoUrl: "",
      lastVisitDate: undefined,
      nextVisitDate: undefined,
      issueSummary: "",
    },
  });
  
  const createPatientMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // First, handle the photo upload if there is one
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        
        // TODO: In a real app, implement a proper photo upload endpoint
        // For this MVP, we'll just pretend it worked and set a placeholder URL
        values.photoUrl = URL.createObjectURL(photoFile);
      }
      
      return await apiRequest('POST', '/api/patients', values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Success",
        description: "Patient has been created successfully.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create patient: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createPatientMutation.mutate(values);
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  return (
    <Card className="shadow">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {patientId ? "Edit Patient" : "New Patient Registration"}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Enter patient information details</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={120} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Gender</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Contact</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-6">
                      <FormLabel>Allergic to medicine</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Penicillin, Aspirin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="sm:col-span-6">
                  <FormLabel className="block text-sm font-medium text-gray-700">Photo</FormLabel>
                  <div className="mt-1 flex items-center">
                    <span className="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                      {photoFile ? (
                        <img 
                          src={URL.createObjectURL(photoFile)} 
                          alt="Patient" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )}
                    </span>
                    <label
                      htmlFor="photo-upload"
                      className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                    >
                      Change
                      <input
                        id="photo-upload"
                        name="photo-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-5">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="mr-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPatientMutation.isPending}
                  >
                    {createPatientMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
