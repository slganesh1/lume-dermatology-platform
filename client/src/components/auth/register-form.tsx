import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldAlert, CheckCircle, Mail } from "lucide-react";
import { insertUserSchema } from "@shared/schema";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Add client-side validation rules
const registerSchema = insertUserSchema.extend({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
  authorizationCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  // If role is doctor or assistant, authorization code is required
  if (data.role === "doctor" || data.role === "assistant") {
    return !!data.authorizationCode;
  }
  return true;
}, {
  message: "Authorization code is required for this role",
  path: ["authorizationCode"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const { registerMutation } = useAuth();
  const [showAuthCode, setShowAuthCode] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "patient", // Default role is now patient
      active: true,
      authorizationCode: "",
    },
    mode: "onChange",
  });
  
  // Watch for role changes to show/hide authorization code field
  const role = useWatch({
    control: form.control,
    name: "role",
  });
  
  useEffect(() => {
    setShowAuthCode(role === "doctor" || role === "assistant");
  }, [role]);

  function onSubmit(data: RegisterValues) {
    // Remove confirmPassword as it's not part of the API schema
    const { confirmPassword, ...registrationData } = data;
    
    registerMutation.mutate(registrationData, {
      onSuccess: () => {
        setRegistrationSuccess(true);
        if (onSuccess) onSuccess();
        form.reset();
      },
    });
  }

  if (registrationSuccess) {
    return (
      <div className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Account Created Successfully!</AlertTitle>
          <AlertDescription className="text-green-700">
            We've sent a verification email to your inbox. Please check your email and click the verification link to activate your account.
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>Didn't receive the email? Check your spam folder or contact support.</span>
        </div>
        
        <Button 
          onClick={() => setRegistrationSuccess(false)}
          variant="outline" 
          className="w-full"
        >
          Back to Registration
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Dr. John Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormDescription>
                We'll send a verification email to confirm your account
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="your-username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="assistant">Assistant</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Patient accounts are for receiving care. Doctor and Assistant roles require authorization.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showAuthCode && (
          <>
            <Alert className="bg-amber-50 border-amber-200">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Authorization Required</AlertTitle>
              <AlertDescription className="text-amber-700">
                Doctor and Assistant roles require an authorization code. Please contact the clinic administrator if you need access.
              </AlertDescription>
            </Alert>
            
            <FormField
              control={form.control}
              name="authorizationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authorization Code</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter authorization code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        
        <Button 
          type="submit" 
          className="w-full mt-6" 
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
        
        {registerMutation.isError && (
          <p className="text-sm text-red-500 text-center">
            {(registerMutation.error as Error).message || "Failed to register. Please try again."}
          </p>
        )}
      </form>
    </Form>
  );
}