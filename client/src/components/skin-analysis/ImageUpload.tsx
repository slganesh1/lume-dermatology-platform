import { useState, useRef, ChangeEvent } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "wouter";
import { Analysis } from "@shared/schema";
import AnalysisResult from "./AnalysisResult";

interface UploadResponse {
  analysis: Analysis;
  error?: string;
}

export default function ImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, navigate] = useNavigate();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/analysis/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: "Your skin analysis has been successfully processed.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your image. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreview(fileReader.result as string);
      };
      fileReader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreview(fileReader.result as string);
      };
      fileReader.readAsDataURL(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    uploadMutation.mutate(formData);
  };

  const handleScheduleAppointment = () => {
    navigate('/appointments');
  };

  const handleViewMedications = () => {
    navigate('/medications');
  };

  return (
    <Card className="shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Skin Analysis</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Upload a photo for dermatological analysis</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              {!preview ? (
                <div 
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        <span>Upload a photo</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only" 
                          accept="image/*" 
                          onChange={handleImageChange}
                          ref={fileInputRef}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Image Preview</h3>
                      <div className="bg-gray-100 rounded-lg overflow-hidden aspect-w-1 aspect-h-1">
                        <img 
                          id="previewImage" 
                          className="object-cover w-full h-64" 
                          src={preview} 
                          alt="Skin image for analysis" 
                        />
                      </div>
                      <div className="mt-4 flex justify-start">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFile(null);
                            setPreview(null);
                          }}
                          className="mr-2"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpload}
                          disabled={uploadMutation.isPending}
                        >
                          {uploadMutation.isPending ? "Analyzing..." : "Analyze Skin"}
                        </Button>
                      </div>
                    </div>
                    {uploadMutation.isPending ? (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Analysis Results</h3>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-4 py-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      uploadMutation.isSuccess && (
                        <AnalysisResult 
                          analysis={uploadMutation.data as Analysis}
                          onScheduleAppointment={handleScheduleAppointment}
                          onViewMedications={handleViewMedications}
                        />
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
