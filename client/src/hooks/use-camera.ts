import { useState, useEffect } from 'react';
import cameraService from '@/services/camera-service';

interface UseCameraProps {
  onPhotoSelected?: (file: File) => void;
}

export function useCamera({ onPhotoSelected }: UseCameraProps = {}) {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async (): Promise<string | undefined> => {
    setIsLoading(true);
    setError(null);
    try {
      const dataUrl = await cameraService.addNewToGallery();
      if (dataUrl) {
        setPhotoDataUrl(dataUrl);
        if (onPhotoSelected) {
          const file = cameraService.dataURLtoFile(dataUrl, `photo_${new Date().getTime()}.jpg`);
          onPhotoSelected(file);
        }
        return dataUrl;
      }
      return undefined;
    } catch (err) {
      setError('Failed to take photo. Please try again.');
      console.error('Error in takePhoto:', err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const selectFromGallery = async (): Promise<string | undefined> => {
    setIsLoading(true);
    setError(null);
    try {
      const dataUrl = await cameraService.selectFromGallery();
      if (dataUrl) {
        setPhotoDataUrl(dataUrl);
        if (onPhotoSelected) {
          const file = cameraService.dataURLtoFile(dataUrl, `photo_${new Date().getTime()}.jpg`);
          onPhotoSelected(file);
        }
        return dataUrl;
      }
      return undefined;
    } catch (err) {
      setError('Failed to select photo. Please try again.');
      console.error('Error in selectFromGallery:', err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const clearPhoto = () => {
    setPhotoDataUrl(undefined);
    setError(null);
  };

  return {
    photoDataUrl,
    isLoading,
    error,
    takePhoto,
    selectFromGallery,
    clearPhoto
  };
}