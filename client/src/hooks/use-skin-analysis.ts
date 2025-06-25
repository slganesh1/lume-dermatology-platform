import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type AnalysisResult, type Patient } from "@shared/schema";

interface AnalysisOptions {
  patientId: number | string;
  notes?: string;
}

interface AnalysisResponse {
  id: number;
  patientId: number;
  imageUrl: string;
  results: AnalysisResult[];
  date: string;
  notes?: string;
  createdAt: string;
}

export function useSkinAnalysis() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    id: number;
    patientId: number;
    patientName?: string;
    imageUrl: string;
    results: AnalysisResult[];
  } | null>(null);

  // Get a list of patients for displaying patient names
  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  // Upload and analyze image mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ 
      file, 
      options 
    }: { 
      file: File; 
      options: AnalysisOptions 
    }) => {
      setIsAnalyzing(true);
      
      const formData = new FormData();
      formData.append("patientId", options.patientId.toString());
      formData.append("image", file);
      
      if (options.notes) {
        formData.append("notes", options.notes);
      }
      
      const response = await apiRequest("POST", "/api/skin-analyses", formData);
      return response.json() as Promise<AnalysisResponse>;
    },
    onSuccess: (data) => {
      setIsAnalyzing(false);

      // Find patient name if available
      const patient = Array.isArray(patients) 
        ? patients.find((p: Patient) => p.id === data.patientId) 
        : undefined;

      setAnalysisResults({
        id: data.id,
        patientId: data.patientId,
        patientName: patient?.name,
        imageUrl: data.imageUrl,
        results: data.results
      });

      queryClient.invalidateQueries({ queryKey: ["/api/skin-analyses"] });

      toast({
        title: "Analysis Complete",
        description: "Skin analysis has been successfully processed."
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: "There was an error processing the skin analysis.",
        variant: "destructive"
      });
      console.error(error);
    }
  });

  const startAnalysis = (file: File, options: AnalysisOptions) => {
    setAnalysisResults(null);
    uploadMutation.mutate({ file, options });
  };

  const resetAnalysis = () => {
    setAnalysisResults(null);
  };

  // Get analysis by ID
  const getAnalysis = async (id: number) => {
    try {
      const response = await apiRequest("GET", `/api/skin-analyses/${id}`);
      const data = await response.json();
      
      // Find patient name if available
      const patient = Array.isArray(patients) 
        ? patients.find((p: Patient) => p.id === data.patientId) 
        : undefined;
      
      setAnalysisResults({
        id: data.id,
        patientId: data.patientId,
        patientName: patient?.name,
        imageUrl: data.imageUrl,
        results: data.results
      });
      
      return data;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load skin analysis",
        variant: "destructive"
      });
      console.error(error);
      return null;
    }
  };

  return {
    isAnalyzing,
    analysisResults,
    startAnalysis,
    resetAnalysis,
    getAnalysis,
    error: uploadMutation.error
  };
}
