import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Patient, type Patient as PatientType } from "@shared/schema";
import { PageHeader } from "@/components/ui/page-header";
import { SkinComparison } from "@/components/skin-comparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers, FileText, Mail, Phone } from "lucide-react";
import { AvatarProfile } from "@/components/ui/avatar-profile";

// Inline PatientBanner component
function PatientBanner({ patient }: { patient: PatientType }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarProfile
            src={patient.profileImage || ""}
            name={patient.name}
            size="lg"
          />
          <div>
            <h2 className="text-xl font-semibold">{patient.name}</h2>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <FileText className="h-4 w-4 mr-1" />
              <span>Patient ID: {patient.pid}</span>
              <span className="mx-2">•</span>
              <span>Age: {patient.age}</span>
              <span className="mx-2">•</span>
              <span>{patient.gender}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 text-sm">
          <div className="flex items-center">
            <Mail className="h-4 w-4 text-gray-500 mr-2" />
            <span>{patient.email}</span>
          </div>
          <div className="flex items-center">
            <Phone className="h-4 w-4 text-gray-500 mr-2" />
            <span>{patient.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SkinComparisonPage() {
  const [_, setLocation] = useLocation();
  const [patientId, setPatientId] = useState<number | null>(null);
  
  // Get patient ID from URL
  useEffect(() => {
    const path = window.location.pathname;
    const matches = path.match(/\/patients\/(\d+)\/comparison/);
    console.log("URL path:", path);
    console.log("URL matches:", matches);
    
    if (matches && matches[1]) {
      const id = parseInt(matches[1]);
      console.log("Setting patient ID to:", id);
      setPatientId(id);
    } else {
      console.warn("Failed to extract patient ID from URL path:", path);
    }
  }, []);
  
  // Fetch patient data
  const { data: patient, isLoading: isLoadingPatient } = useQuery<PatientType>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });
  
  const handleBack = () => {
    if (patientId) {
      setLocation(`/patients/${patientId}/records`);
    } else {
      setLocation('/patients');
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        heading="Skin Condition Comparison"
        subheading="Compare skin condition between different visits to track treatment progress"
        actions={
          <Button variant="outline" onClick={handleBack} size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        }
      />
      
      {patient && (
        <PatientBanner patient={patient} />
      )}
      
      <Tabs defaultValue="comparison">
        <TabsList>
          <TabsTrigger value="comparison" className="gap-1">
            <Layers className="h-4 w-4" />
            <span>Comparison Tool</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="comparison" className="mt-6">
          {patientId && <SkinComparison patientId={patientId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}