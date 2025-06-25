import type { CapacitorConfig } from '@capacitor/cli';
import { appConfig } from './client/src/capacitor-config';

// Import app-specific configuration values
const config: CapacitorConfig = {
  appId: 'com.lume.app',
  appName: 'LUME',
  webDir: 'client/dist',
  // Modern configuration 
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
  }
};

export default config;
