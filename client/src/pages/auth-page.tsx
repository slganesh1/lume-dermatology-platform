import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";

import { AppDownloadLinks } from "@/components/app-download-links";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { user, isLoading } = useAuth();

  // Redirect to home if user is already logged in
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Form section */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-4 md:p-8 bg-white relative">
        <img 
          src="/src/assets/skin-pattern.svg" 
          alt="Background pattern" 
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="relative z-10 w-full max-w-md">
          <Card className="w-full border-none shadow-xl bg-white/80 backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary/60 to-primary"></div>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-black">Welcome to LUME</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to access the comprehensive medical imaging platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="login"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100">
                  <TabsTrigger value="login" className="data-[state=active]:bg-white">Login</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-white">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <div className="space-y-4">
                    <LoginForm />
                  </div>
                </TabsContent>
                <TabsContent value="register">
                  <div className="space-y-4">
                    <RegisterForm
                      onSuccess={() => setActiveTab("login")}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col items-center text-sm text-muted-foreground border-t pt-4">
              <p className="font-medium text-primary">LUME - Advanced Dermatology Platform</p>
              <p className="text-gray-500 text-xs mt-1">© 2025 LUME. All rights reserved.</p>
              <div className="mt-4 w-full">
                <Separator className="mb-4" />
                <AppDownloadLinks variant="default" />
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Hero section */}
      <div className="w-full md:w-1/2 relative p-4 md:p-8 flex flex-col justify-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay">
            <img src="/src/assets/hero-bg.svg" alt="Background" className="w-full h-full object-cover" />
          </div>
        </div>
        
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="mb-6 flex items-center">
            <div className="rounded-full bg-black border-2 border-primary p-2 h-16 w-16 mr-4 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a9 9 0 0 0-9 9s2 6 9 6 9-6 9-6a9 9 0 0 0-9-9z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">LUME</span>
              </h1>
              <p className="text-xs text-primary uppercase tracking-wider font-light">Bringing Brightness</p>
            </div>
          </div>
          
          <div className="mb-6 rounded-xl overflow-hidden shadow-2xl">
            <img src="/src/assets/dermatology-treatment.jpg" alt="Professional dermatology treatment" className="w-full h-auto" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Advanced Medical Imaging & Analysis
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            LUME uses cutting-edge AI technology to provide precise, 
            user-friendly healthcare solutions for skin conditions and more.
          </p>
          <div className="space-y-6">
            <div className="flex items-start bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <div className="rounded-full bg-primary p-2 mr-4 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-lg">AI-Powered Analysis</h3>
                <p className="opacity-90">
                  Get detailed insights and treatment recommendations from our advanced AI system
                </p>
              </div>
            </div>
            <div className="flex items-start bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <div className="rounded-full bg-primary p-2 mr-4 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-lg">Patient Management</h3>
                <p className="opacity-90">
                  Comprehensive patient records and medication tracking with complete history
                </p>
              </div>
            </div>
            <div className="flex items-start bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <div className="rounded-full bg-primary p-2 mr-4 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-lg">Appointment Scheduling</h3>
                <p className="opacity-90">
                  Efficiently manage appointments with easy scheduling and reminders
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-primary/20 rounded-full backdrop-blur-sm">
              <span className="text-sm text-primary-foreground">Trusted by leading dermatology clinics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}