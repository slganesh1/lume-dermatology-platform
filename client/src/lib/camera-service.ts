import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

/**
 * A service to handle camera functionalities, adapting to both mobile and web platforms
 */
export interface PhotoResult {
  dataUrl: string;
  format: string;
  saved?: boolean;
}

/**
 * Checks if the app is running on a mobile device with Capacitor
 */
export function isMobileApp(): boolean {
  return 'Capacitor' in window;
}

/**
 * Takes a photo using device camera
 * Uses Capacitor Camera on mobile, falls back to web implementation on desktop
 */
export async function takePhoto(): Promise<PhotoResult | null> {
  try {
    if (isMobileApp()) {
      // Mobile implementation using Capacitor
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 90,
        width: 1024,
        height: 1024,
        correctOrientation: true,
      });

      if (!photo.dataUrl) {
        return null;
      }

      return {
        dataUrl: photo.dataUrl,
        format: photo.format || 'jpeg',
        saved: true
      };
    } else {
      // Web fallback implementation
      return new Promise((resolve) => {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        // Handle file selection
        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          
          // Read the file as data URL
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const format = file.type.split('/')[1] || 'jpeg';
            
            resolve({
              dataUrl,
              format,
              saved: false
            });
          };
          
          reader.onerror = () => {
            console.error('Error reading file');
            resolve(null);
          };
          
          reader.readAsDataURL(file);
        };
        
        // Trigger file selection
        input.click();
      });
    }
  } catch (error) {
    console.error('Error capturing photo:', error);
    return null;
  }
}

/**
 * Selects a photo from the device gallery
 * Uses Capacitor Photos on mobile, falls back to web implementation on desktop
 */
export async function selectFromGallery(): Promise<PhotoResult | null> {
  try {
    if (isMobileApp()) {
      // Mobile implementation using Capacitor
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        quality: 90,
        width: 1024,
        height: 1024,
        correctOrientation: true,
      });

      if (!photo.dataUrl) {
        return null;
      }

      return {
        dataUrl: photo.dataUrl,
        format: photo.format || 'jpeg',
        saved: true
      };
    } else {
      // Web fallback implementation
      return new Promise((resolve) => {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        // Handle file selection
        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          
          // Read the file as data URL
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const format = file.type.split('/')[1] || 'jpeg';
            
            resolve({
              dataUrl,
              format,
              saved: false
            });
          };
          
          reader.onerror = () => {
            console.error('Error reading file');
            resolve(null);
          };
          
          reader.readAsDataURL(file);
        };
        
        // Trigger file selection
        input.click();
      });
    }
  } catch (error) {
    console.error('Error selecting photo:', error);
    return null;
  }
}

/**
 * Helper function to convert Data URL to File object
 */
export function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}