import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.demo.push',
  appName: '(Demo) Push',
  plugins: {
    PushNotifications: {
      presentationOptions: [],
    },
  },
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
