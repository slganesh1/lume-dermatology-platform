// Type definitions for Capacitor global object
interface Window {
  Capacitor?: {
    isNativePlatform: () => boolean;
    getPlatform: () => string;
    [key: string]: any;
  };
}