import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "@/components/ui/sidebar";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import SkinAnalysis from "@/pages/skin-analysis";
import SkinComparisonPage from "@/pages/skin-comparison";
import Appointments from "@/pages/appointments";
import AppointmentDetails from "@/pages/appointment-details";
import AppointmentsTest from "@/pages/appointments-test";
import Pharmacy from "@/pages/pharmacy";
import Reports from "@/pages/reports";
import Prescriptions from "@/pages/prescriptions";
import NewPrescription from "@/pages/new-prescription";
import EditMedication from "@/pages/edit-medication";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";
import TestProfilePage from "@/pages/test-profile";
import TestWebSocketPage from "@/pages/test-websocket";
import ClearSessionPage from "@/pages/clear-session";
import CreateProfile from "@/pages/create-profile";
import CareHub from "@/pages/care-hub";
import ResourcesPage from "@/pages/resources";
import ExpertValidation from "@/pages/expert-validation";
import VideoCallPage from "@/pages/video-call-page";
import VideoTestPage from "@/pages/video-test-page";
import AnalysisDetailsPage from "@/pages/analysis-details";
import VerifyEmail from "@/pages/verify-email";
import NotFound from "@/pages/not-found";

import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/ui/mobile-layout";
import { Capacitor } from '@capacitor/core';
import { AuthProvider } from "@/hooks/use-auth";
import { WebSocketProvider } from "@/hooks/use-websocket";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNativePlatform, setIsNativePlatform] = useState(false);

  useEffect(() => {
    setIsNativePlatform(Capacitor.isNativePlatform());
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Main application routes with authentication
  const AppRoutes = (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/verify-email" component={VerifyEmail} />
      <ProtectedRoute path="/" component={() => <Dashboard />} />
      <ProtectedRoute path="/profile" component={() => <ProfilePage />} />
      <ProtectedRoute path="/test-profile" component={() => <TestProfilePage />} />
      <ProtectedRoute path="/test-websocket" component={() => <TestWebSocketPage />} />
      <Route path="/clear-session" component={ClearSessionPage} />
      <ProtectedRoute path="/create-profile" component={() => <CreateProfile />} />
      <ProtectedRoute path="/patients" component={() => <Patients />} />
      <ProtectedRoute path="/patients/pid/:pid" component={() => <Patients />} />
      <ProtectedRoute path="/patients/:id/edit" component={() => <Patients />} />
      <ProtectedRoute path="/patients/:id/records" component={() => <Patients />} />
      <ProtectedRoute path="/patients/:id/comparison" component={() => <SkinComparisonPage />} />
      <ProtectedRoute path="/analysis/:id" component={() => <AnalysisDetailsPage />} />
      <ProtectedRoute path="/appointments/new" component={() => <Appointments />} />
      <ProtectedRoute path="/appointments/:id" component={() => <AppointmentDetails />} />
      <ProtectedRoute path="/appointments/:id/edit" component={() => <AppointmentDetails />} />
      <ProtectedRoute path="/skin-analysis" component={() => <SkinAnalysis />} />
      <ProtectedRoute path="/appointments" component={() => <Appointments />} />
      <ProtectedRoute path="/pharmacy" component={() => <Pharmacy />} />
      <ProtectedRoute path="/medications/:id/edit" component={() => <EditMedication />} />
      <ProtectedRoute path="/reports" component={() => <Reports />} />
      <ProtectedRoute path="/prescriptions" component={() => <Prescriptions />} />
      <ProtectedRoute path="/prescriptions/new" component={() => <NewPrescription />} />
      <ProtectedRoute path="/care-hub" component={() => <CareHub />} />
      <ProtectedRoute path="/resources/:careType/:resourceType" component={() => <ResourcesPage />} />
      <ProtectedRoute path="/expert-validation" component={() => <ExpertValidation />} />
      <ProtectedRoute path="/video-call/:roomId" component={() => <VideoCallPage />} />
      <ProtectedRoute path="/video-test" component={() => <VideoTestPage />} />

      <Route component={NotFound} />
    </Switch>
  );

  // For Capacitor apps (mobile), use the mobile layout
  if (isNativePlatform) {
    return (
      <MobileLayout>
        <div className="px-4 pb-2">
          {AppRoutes}
        </div>
      </MobileLayout>
    );
  }

  // For web, use the regular layout with sidebar
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
      
      <main className="flex-1 overflow-y-auto pt-0 md:pt-0 pb-10 px-4 md:px-8 md:ml-64">
        {AppRoutes}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <Router />
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
