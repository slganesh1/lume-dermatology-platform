import { ChangeEvent, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X, Camera } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  previewUrl?: string | null;
  className?: string;
}

export function ImageUpload({ onImageSelected, previewUrl, className = '' }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Set initial preview if one is provided
  useEffect(() => {
    if (previewUrl) {
      console.log("Setting preview URL:", previewUrl);
      setPreview(previewUrl);
    }
  }, [previewUrl]);
  
  // Create preview when file is selected
  useEffect(() => {
    if (!selectedFile) return;
    
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    
    // Free memory when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        onImageSelected(file);
      } else {
        // Alert the user about invalid file type
        alert("Please select only JPG, JPEG or PNG files.");
      }
    }
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        onImageSelected(file);
      } else {
        // Alert the user about invalid file type
        alert("Please select only JPG, JPEG or PNG files.");
        // Reset the input
        e.target.value = '';
      }
    }
  };
  
  const clearImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview(null);
    setSelectedFile(null);
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) input.value = '';
  };
  
  // Function to take a photo using device camera
  const takePhoto = async () => {
    try {
      // Request camera permissions and take a photo
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      
      if (image.dataUrl) {
        // Set the preview with the data URL
        setPreview(image.dataUrl);
        
        // Convert data URL to File object
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        
        setSelectedFile(file);
        onImageSelected(file);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  return (
    <div className={className}>
      {preview ? (
        <div className="relative rounded-md overflow-hidden border border-gray-300">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-64 object-cover" 
          />
          <Button 
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 rounded-full h-8 w-8"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="absolute bottom-2 right-2"
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            Change Image
          </Button>
        </div>
      ) : (
        <div 
          className={`relative border-2 border-dashed rounded-md p-6 text-center ${
            dragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleChange}
          />
          
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500">
                Drag & drop an image here, or click to select
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG or JPEG up to 5MB
              </p>
              <div className="flex gap-2 mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => e.preventDefault()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Select Image
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    takePhoto();
                  }}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Take Photo
                </Button>
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}