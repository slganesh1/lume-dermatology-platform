import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

class CameraService {
  /**
   * Check if the app is running natively in Capacitor
   */
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Take a photo using the device camera and return it as a data URL
   * @returns Promise<string | undefined> Data URL of the captured image
   */
  async addNewToGallery(): Promise<string | undefined> {
    try {
      // Take a photo using the device camera
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 90,
        width: 1024,
        height: 1024,
        correctOrientation: true,
      });

      return capturedPhoto.dataUrl;
    } catch (error) {
      console.error('Error capturing photo:', error);
      return undefined;
    }
  }

  /**
   * Select an image from the device gallery and return it as a data URL
   * @returns Promise<string | undefined> Data URL of the selected image
   */
  async selectFromGallery(): Promise<string | undefined> {
    try {
      // Select an image from the device gallery
      const selectedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        quality: 90,
        width: 1024,
        height: 1024,
        correctOrientation: true,
      });

      return selectedPhoto.dataUrl;
    } catch (error) {
      console.error('Error selecting photo from gallery:', error);
      return undefined;
    }
  }

  /**
   * Convert a data URL to a File object
   * @param dataUrl The data URL string to convert
   * @param filename The filename to use for the File
   * @returns File object created from the data URL
   */
  dataURLtoFile(dataUrl: string, filename: string): File {
    // Extract the content type and base64 data
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    // Convert to binary
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    // Create and return a new File object
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Attempt to get limited access to photos on iOS
   * This deals with iOS 14+ privacy changes
   */
  async requestLimitedPhotoAccess(): Promise<void> {
    try {
      if (Capacitor.getPlatform() === 'ios') {
        await Camera.requestPermissions({ permissions: ['photos'] });
      }
    } catch (error) {
      console.error('Error requesting limited photo access:', error);
    }
  }
}

// Create a singleton instance
const cameraService = new CameraService();

export default cameraService;