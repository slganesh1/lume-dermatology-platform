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
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generatePatientId } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { insertPatientSchema, type Patient } from "@shared/schema";

interface PatientFormProps {
  patientId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Extend the insert schema with additional validation
const formSchema = insertPatientSchema.extend({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  age: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).max(120, {
      message: "Age must be between 0 and 120.",
    })
  ),
  gender: z.enum(["Male", "Female", "Other"], {
    message: "Please select a gender.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function PatientForm({ patientId, onSuccess, onCancel }: PatientFormProps) {
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const isEditMode = !!patientId;

  // Fetch patient data if in edit mode
  const { data: patient, isLoading: isLoadingPatient } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: isEditMode,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pid: generatePatientId(),
      name: "",
      email: "",
      phone: "",
      age: undefined,
      gender: undefined,
      address: "",
      allergies: "",
    },
  });

  // Update form values when patient data is loaded
  useEffect(() => {
    if (patient) {
      form.reset({
        pid: patient.pid,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender as "Male" | "Female" | "Other",
        address: patient.address || "",
        allergies: patient.allergies || "",
      });
    }
  }, [patient, form]);

  // Create patient mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Creating patient with data:", data);
      
      const formData = new FormData();
      
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Append profile image if selected
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }
      
      try {
        const response = await apiRequest("POST", "/api/patients", formData);
        const result = await response.json();
        console.log("Patient created successfully:", result);
        return result;
      } catch (error) {
        console.error("Error creating patient:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Patient created successfully",
      });
      form.reset();
      setProfileImage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create patient",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Update patient mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      console.log("Updating patient with data:", data);
      
      const formData = new FormData();
      
      // Append all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Append profile image if selected
      if (profileImage) {
        formData.append("profileImage", profileImage);
        console.log("Adding profile image to form data:", profileImage.name);
      } else {
        console.log("No new profile image selected");
      }
      
      try {
        console.log("Sending update request to:", `/api/patients/${patientId}`);
        const response = await apiRequest("PUT", `/api/patients/${patientId}`, formData);
        const result = await response.json();
        console.log("Patient updated successfully:", result);
        return result;
      } catch (error) {
        console.error("Error updating patient:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update patient",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImageSelected = (file: File) => {
    setProfileImage(file);
  };

  if (isEditMode && isLoadingPatient) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {isEditMode && (
              <FormField
                control={form.control}
                name="pid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient ID</FormLabel>
                    <FormControl>
                      <Input disabled {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Age"
                        {...field}
                        value={field.value?.toString() || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Male" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Male
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Female" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Female
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Other" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Other
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter address" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List any allergies to medications" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <FormLabel>Profile Photo</FormLabel>
            <ImageUpload
              onImageSelected={handleImageSelected}
              previewUrl={patient?.profileImage || undefined}
              className="mt-2"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              if (onCancel) {
                onCancel();
              } else if (onSuccess) {
                onSuccess();
              }
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
              "Update Patient"
            ) : (
              "Create Patient"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
