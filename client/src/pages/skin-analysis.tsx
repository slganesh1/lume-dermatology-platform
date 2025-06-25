import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { useLocation } from "wouter";
import { type Patient, type AnalysisResult } from "@shared/schema";
import { AlertCircle, Camera, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import MedicalCamera from "@/components/medical-camera";
import { dataURLtoFile } from "@/lib/camera-service";
import { AIChatbot } from "@/components/ai-chatbot";

export default function SkinAnalysis() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Fixed to use GPT-4o only
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    id: number;
    patientId: number;
    patientName?: string; 
    imageUrl: string;
    imageType: string;
    bodyPart?: string;
    results: AnalysisResult[];
    validationStatus?: string;
    expertComments?: string;
  } | null>(null);
  const [isLoadingPatientData, setIsLoadingPatientData] = useState(false);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  // Body part selection removed as requested
  
  const formRef = useRef<HTMLFormElement>(null);
  const isPatient = user?.role === "patient";

  // Fetch patients for the dropdown - only for doctors and assistants
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/patients"],
    enabled: !isPatient // Only fetch patients when the user is not a patient
  });
  
  // Fetch patient data for the current user if they are a patient
  useEffect(() => {
    const fetchPatientData = async () => {
      if (isPatient && user) {
        try {
          setIsLoadingPatientData(true);
          const response = await fetch(`/api/patients/user/${user.id}`);
          if (!response.ok) throw new Error("Failed to fetch patient data");
          const data = await response.json();
          setPatientData(data);
          // Automatically set the selected patient ID
          setSelectedPatientId(data.id.toString());
          setIsLoadingPatientData(false);
        } catch (error) {
          console.error("Error fetching patient data:", error);
          setIsLoadingPatientData(false);
          toast({
            title: "Error",
            description: "Failed to load your patient data. Please try again.",
            variant: "destructive"
          });
        }
      }
    };
    
    fetchPatientData();
  }, [isPatient, user, toast]);

  const handleImageSelected = (file: File) => {
    setSelectedFile(file);
  };
  
  // Handle image capture from MedicalCamera component
  const handleImageCapture = (dataUrl: string, format: string) => {
    const fileName = `skin-image-${Date.now()}.${format}`;
    const file = dataURLtoFile(dataUrl, fileName);
    setSelectedFile(file);
  };

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get patient ID from either the dropdown or the patient data
    const patientId = isPatient && patientData 
      ? patientData.id.toString() 
      : selectedPatientId;
    
    // For doctors/assistants, they must select a patient
    if (!isPatient && !patientId) {
      toast({
        title: "Patient Required",
        description: "Please select a patient before starting analysis.",
        variant: "destructive"
      });
      return;
    }
    
    // For patients, they must have a valid patient record
    if (isPatient && !patientData) {
      toast({
        title: "Patient Record Missing",
        description: "Your patient record could not be found. Please contact support.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: "Image Required",
        description: "Please upload an image for analysis.",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResults(null);
    
    const formData = new FormData();
    formData.append("patientId", patientId);
    formData.append("image", selectedFile);
    formData.append("imageType", "skin");
    formData.append("analysisService", "openai"); // Fixed to use GPT-4o only
    
    // Add any notes if provided
    const notesElement = document.getElementById("notes") as HTMLTextAreaElement;
    if (notesElement && notesElement.value) {
      formData.append("notes", notesElement.value);
    }
    
    try {
      const response = await fetch("/api/skin-analyses", {
        method: "POST",
        body: formData,
        credentials: "include" // Important for sending cookies/session
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Find patient name if available
      const patient = Array.isArray(patients) 
        ? patients.find((p: Patient) => p.id === data.patientId) 
        : patientData;
      
      setAnalysisResults({
        id: data.id,
        patientId: data.patientId,
        patientName: patient?.name || "Patient",
        imageUrl: data.imageUrl,
        imageType: data.imageType || 'skin',
        bodyPart: data.bodyPart,
        results: data.results,
        validationStatus: "pending", // New analyses start as pending expert review
        expertComments: undefined
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/skin-analyses"] });
      
      toast({
        title: "Analysis Complete",
        description: "Skin analysis has been successfully processed. View results in your profile.",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation('/profile?tab=analyses')}
            className="bg-white hover:bg-gray-50 text-black border-gray-300"
          >
            View Results
          </Button>
        )
      });
    } catch (error: any) {
      console.error("Skin analysis error:", error);
      
      // Try to extract specific error message if available
      let errorMessage = "There was an error processing the analysis.";
      
      if (error?.message) {
        errorMessage = error.message;
      }
      
      // Check for specific error conditions
      if (errorMessage.includes("format allowed")) {
        errorMessage = "Only JPG, JPEG and PNG image formats are supported.";
      } else if (errorMessage.includes("API key")) {
        errorMessage = "OpenAI API key is missing or invalid. Please contact support.";
      }
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Body part change handler removed

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 w-full h-full">
            <img src="/uploads/rejuvenating-facial-treatment_158595-4601.jpg" alt="Dermatological treatment" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/80"></div>
          </div>
          <div className="relative z-10 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">AI Medical Image Analysis</h1>
                <p className="text-lg opacity-90 max-w-2xl">
                  Upload an image to receive AI-powered analysis and treatment recommendations.
                  All analyses are stored securely in the patient's medical record.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg mt-4 md:mt-0">
                <Camera className="h-20 w-20 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation to Results Section */}
        <Card className="mb-6 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-gray-900">View Your Analysis Results</p>
                  <p className="text-sm text-gray-600">Access all your previous skin analyses and expert reviews</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/profile?tab=analyses')}
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                Go to My Profile → Skin Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden mb-8 shadow-lg border-none">
          <div className="bg-gradient-to-r from-primary/80 to-primary p-6 text-black relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-20">
              <svg width="150" height="150" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="100" fill="white" fillOpacity="0.2" />
                <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.2" />
                <circle cx="100" cy="100" r="60" fill="white" fillOpacity="0.2" />
              </svg>
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-semibold flex items-center">
                <Camera className="h-5 w-5 mr-2" /> New Skin Analysis
              </h2>
              <p className="mt-1 opacity-90">
                Get accurate assessments of various skin conditions through our advanced AI technology
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="bg-black/20 hover:bg-black/30 text-black border-none">Accurate Analysis</Badge>
                <Badge variant="secondary" className="bg-black/20 hover:bg-black/30 text-black border-none">Treatment Suggestions</Badge>
                <Badge variant="secondary" className="bg-black/20 hover:bg-black/30 text-black border-none">Secure Storage</Badge>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            <form ref={formRef} onSubmit={handleStartAnalysis}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {isPatient ? (
                    <div className="mb-6">
                      {isLoadingPatientData ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading your patient data...</span>
                        </div>
                      ) : patientData ? (
                        <div className="bg-primary/10 p-4 rounded-lg">
                          <p className="font-medium">Patient: {patientData.name}</p>
                          <p className="text-sm text-muted-foreground">PID: {patientData.pid}</p>
                          <input type="hidden" value={patientData.id} />
                        </div>
                      ) : (
                        <div className="bg-warning/10 p-4 rounded-lg">
                          <p className="text-warning-foreground font-medium">Patient Profile Required</p>
                          <p className="text-sm mb-3">You need to create your patient profile before using the skin analysis feature</p>
                          <Button 
                            onClick={() => setLocation("/create-profile")} 
                            className="bg-primary text-black hover:bg-primary/90"
                            size="sm"
                          >
                            Create Patient Profile
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6">
                      <Label htmlFor="patient-select" className="mb-2 block">Select Patient</Label>
                      <Select
                        value={selectedPatientId}
                        onValueChange={(value) => setSelectedPatientId(value)}
                        disabled={isLoadingPatients}
                      >
                        <SelectTrigger id="patient-select">
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingPatients ? (
                            <SelectItem value="loading" disabled>
                              Loading patients...
                            </SelectItem>
                          ) : Array.isArray(patients) && patients.length > 0 ? (
                            patients.map((patient: Patient) => (
                              <SelectItem key={patient.id} value={patient.id.toString()}>
                                {patient.name} (PID: {patient.pid})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No patients available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <Label htmlFor="notes" className="mb-2 block">Additional Notes (Optional)</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Add any symptoms, concerns, or relevant information about this condition..." 
                      className="resize-none min-h-[100px]"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Take Photo or Upload Image</Label>
                  
                  {selectedFile ? (
                    <div className="border-2 border-primary rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="relative mb-4">
                          <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="Preview"
                            className="max-h-48 rounded-lg shadow-md mx-auto"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-gray-800/50 hover:bg-gray-800/70 p-1 rounded-full text-white"
                            onClick={() => setSelectedFile(null)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                        <div className="mt-2 flex justify-center">
                          <CheckCircle2 className="text-green-500 h-5 w-5" />
                          <span className="text-sm text-green-600 ml-1">Image ready for analysis</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <MedicalCamera 
                      onImageCapture={handleImageCapture}
                      imageType="skin"
                    />
                  )}
                  
                  <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-700">
                      <p className="font-medium mb-1">Important Note</p>
                      <p>
                        This AI analysis is for informational purposes and preliminary assessment only. 
                        All results should be confirmed by a healthcare professional before making 
                        medical decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="mr-4"
                  onClick={() => setLocation("/skin-analyses")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAnalyzing || (!selectedPatientId && !isPatient) || !selectedFile}
                >
                  {isAnalyzing ? (
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
                      Analyzing...
                    </>
                  ) : (
                    <>Analyze Image <Upload className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Analysis Complete Notification */}
        {analysisResults && (
          <div className="bg-white rounded-xl shadow-sm mb-8">
            <div className="p-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Analysis Complete!</h3>
              <p className="text-gray-600 mb-4">
                Your skin analysis has been completed and saved to your medical record.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>To view your results:</strong> Go to <strong>My Profile → Skin Analysis</strong> section
                </p>
              </div>
              <p className="text-xs text-gray-500">
                All analyses are reviewed by medical experts before final approval.
              </p>
            </div>
          </div>
        )}
        
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="relative">
            <CardHeader className="relative z-10 border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="text-2xl text-gray-800">How LUME Works</CardTitle>
              <CardDescription className="text-gray-600">
                Our platform uses advanced AI models to analyze medical images
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-8">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 rounded-full p-3 text-primary">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-primary">1. Take Photo or Upload Image</h3>
                    <p className="text-gray-600">
                      Capture a photo with your camera or upload a clear, high-quality image for optimal results
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 rounded-full p-3 text-primary">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8Z" stroke="currentColor" strokeWidth="2" />
                      <path d="M7 13.5L10 16.5L17 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-primary">2. AI-Powered Analysis</h3>
                    <p className="text-gray-600">
                      Our advanced AI system analyzes the image to identify skin conditions, features, and possible diagnoses
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 rounded-full p-3 text-primary">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M12 3V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M10 7L12 9L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-primary">3. Comprehensive Results</h3>
                    <p className="text-gray-600">
                      Receive detailed information about potential conditions, treatments, and recommended next steps
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}