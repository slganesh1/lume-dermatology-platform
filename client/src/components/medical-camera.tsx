import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, Image, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { takePhoto, selectFromGallery, PhotoResult, isMobileApp } from '../lib/camera-service';

interface MedicalCameraProps {
  onImageCapture: (dataUrl: string, format: string) => void;
  bodyPartOptions?: string[];
  onBodyPartChange?: (bodyPart: string) => void;
  selectedBodyPart?: string;
  imageType: string;
}

export default function MedicalCamera({
  onImageCapture,
  bodyPartOptions = [],
  onBodyPartChange,
  selectedBodyPart,
  imageType
}: MedicalCameraProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCapturePhoto() {
    setIsLoading(true);
    try {
      const result = await takePhoto();
      if (result) {
        processPhotoResult(result);
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectFromGallery() {
    setIsLoading(true);
    try {
      const result = await selectFromGallery();
      if (result) {
        processPhotoResult(result);
      }
    } catch (error) {
      console.error("Error selecting from gallery:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function processPhotoResult(result: PhotoResult) {
    setCapturedImage(result.dataUrl);
    onImageCapture(result.dataUrl, result.format);
  }

  function handleBodyPartChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (onBodyPartChange) {
      onBodyPartChange(e.target.value);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {bodyPartOptions.length > 0 && onBodyPartChange && (
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-semibold text-sm">Select Body Area</span>
            </label>
            <select
              value={selectedBodyPart || ''}
              onChange={handleBodyPartChange}
              className="select select-bordered w-full border rounded-lg p-2 bg-background"
            >
              <option value="">Select a body part</option>
              {bodyPartOptions.map((part) => (
                <option key={part} value={part}>
                  {part}
                </option>
              ))}
            </select>
          </div>
        )}

        {capturedImage ? (
          <Card className="overflow-hidden bg-black/5">
            <CardContent className="p-0 relative">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-auto max-h-[400px] object-contain"
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 backdrop-blur-sm"
                  onClick={() => setCapturedImage(null)}
                >
                  Retake
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-dashed bg-muted/30">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-4">
              <div className="text-center text-muted-foreground">
                <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium">Capture {imageType} Image</h3>
                <p className="text-sm mt-2 max-w-md">
                  Please ensure good lighting and focus for accurate analysis.
                </p>
              </div>
              
              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isLoading}
                  onClick={handleCapturePhoto}
                >
                  <Camera className="h-4 w-4" />
                  <span>{isMobileApp() ? 'Take Photo' : 'Select File'}</span>
                </Button>
                
                {isMobileApp() && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isLoading}
                    onClick={handleSelectFromGallery}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Gallery</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}