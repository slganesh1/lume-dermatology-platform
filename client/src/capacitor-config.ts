import { CapacitorConfig } from '@capacitor/cli';

export interface AppConfig {
  apiUrl: string;
  version: string;
  buildNumber: string;
  appName: string;
  enablePushNotifications: boolean;
  splashScreen: {
    launchAutoHide: boolean;
    launchDuration: number;
    backgroundColor: string;
    spinnerColor: string;
    spinnerSize: string;
  };
}

// Default configuration for web
const defaultConfig: AppConfig = {
  apiUrl: '',
  version: '1.0.0',
  buildNumber: '1',
  appName: 'LUME',
  enablePushNotifications: false,
  splashScreen: {
    launchAutoHide: true,
    launchDuration: 1500,
    backgroundColor: '#000000',
    spinnerColor: '#E6B31E', // Gold spinner color to match LUME theme
    spinnerSize: '50px',
  },
};

// Production API URL
const productionApiUrl = 'https://api.lume.app';

// Development API URL (local server)
const developmentApiUrl = window.location.origin;

// Determine which environment we're in
const isProduction = import.meta.env.PROD;

// Create final config by merging default with environment-specific values
export const appConfig: AppConfig = {
  ...defaultConfig,
  apiUrl: isProduction ? productionApiUrl : developmentApiUrl,
};

// Capacitor specific configuration
export const capacitorConfig: CapacitorConfig = {
  appId: 'com.lume.app',
  appName: 'LUME',
  webDir: 'client/dist',
  // See Capacitor config options here: https://capacitorjs.com/docs/config
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: appConfig.splashScreen.launchAutoHide,
      launchShowDuration: appConfig.splashScreen.launchDuration,
      backgroundColor: appConfig.splashScreen.backgroundColor,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: appConfig.splashScreen.spinnerColor,
      spinnerSize: appConfig.splashScreen.spinnerSize,
    },
    Camera: {
      // Modern permissions model, prompt user for permissions at runtime
      permissions: ['camera']
    },
  },
};