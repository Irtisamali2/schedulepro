import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scheduled.app',
  appName: 'Scheduled',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#3b5ac2",
      showSpinner: false,
      launchFadeOutDuration: 300,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#3b5ac2',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
    scheme: 'scheduled',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
};

export default config;
