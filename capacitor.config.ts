import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scheduled.app',
  appName: 'Scheduled',
  webDir: 'dist/public',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#999999"
    },
    StatusBar: {
      style: "dark"
    }
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#ffffff",
    preferredContentMode: "mobile"
  },
  server: {
    androidScheme: "https"
  }
};

export default config;
