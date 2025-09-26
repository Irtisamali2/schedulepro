import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scheduled.app',
  appName: 'Scheduled',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#3b5ac2",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    }
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#ffffff",
    preferredContentMode: "mobile",
    scheme: "scheduled"
  },
  server: {
    hostname: "app.scheduled.app",
    androidScheme: "https"
  }
};

export default config;
