import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.demo.push',
  appName: '(Demo) Push',
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
