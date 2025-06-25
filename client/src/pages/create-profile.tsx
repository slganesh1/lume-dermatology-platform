import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShieldAlert } from "lucide-react";
import { formatISO } from "date-fns";
import PageHeader from "@/components/ui/page-header";

// Form schema with validation
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.string().transform((val) => Number(val)), // Use Number() instead of parseInt()
  gender: z.string().min(1, "Please select a gender"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
  allergies: z.string().optional(),
  lastVisitDate: z.string().optional(),
  nextVisitDate: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CreateProfile() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a unique patient ID
  const generatePatientId = () => {
    const prefix = "DRM";
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomDigits}`;
  };

  // Initialize form with default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      age: "" as any, // This will be transformed to a number by the schema
      gender: "",
      email: "",
      phone: "",
      address: "",
      allergies: "",
      lastVisitDate: formatISO(new Date(), { representation: 'date' }),
      nextVisitDate: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a profile",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const patientData = {
        ...data,
        userId: user.id,
        pid: generatePatientId(),
      };

      const response = await apiRequest("POST", "/api/patients", patientData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create patient profile");
      }

      toast({
        title: "Profile Created",
        description: "Your patient profile has been created successfully.",
      });

      // Invalidate patient data queries
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/user", user.id] });

      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (error) {
      console.error("Error creating patient profile:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Create Your Patient Profile"
        description="Set up your medical information for personalized care"
        backButton={{
          label: "Back to Dashboard",
          onClick: () => setLocation("/dashboard"),
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="md:col-span-1">
          <Card className="bg-gradient-to-r from-primary/10 to-black/5 border-none shadow-md sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Why We Need This Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Your patient profile helps our medical team provide you with the best possible care. 
                This information is used to:
              </p>
              <ul className="text-sm space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="bg-primary/20 rounded-full p-1 text-primary mr-2 mt-0.5">✓</span>
                  <span>Personalize your skin condition analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/20 rounded-full p-1 text-primary mr-2 mt-0.5">✓</span>
                  <span>Track your medical history and treatments</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/20 rounded-full p-1 text-primary mr-2 mt-0.5">✓</span>
                  <span>Schedule and manage your appointments</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/20 rounded-full p-1 text-primary mr-2 mt-0.5">✓</span>
                  <span>Provide accurate prescription information</span>
                </li>
              </ul>
              
              <div className="bg-muted/20 p-3 rounded-md">
                <div className="flex items-center mb-2">
                  <ShieldAlert className="h-4 w-4 text-primary mr-2" />
                  <p className="text-sm font-medium">Privacy Notice</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your information is secure and will only be visible to authorized medical personnel. 
                  We adhere to strict privacy standards to protect your personal health information.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>
                Please fill in your personal and medical details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Your age" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Your email address" {...field} />
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
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Your address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Medical Information */}
                    <div className="md:col-span-2 pt-4 border-t">
                      <h3 className="font-medium mb-2">Medical Information</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Allergies</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List any allergies to medications, skin products, or other substances" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            This will help our doctors prescribe safe treatments for you
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastVisitDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Visit Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            When did you last see a dermatologist?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nextVisitDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Next Visit</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            When would you like to schedule your first visit?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLocation("/dashboard")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-primary text-black hover:bg-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating Profile..." : "Create Patient Profile"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}