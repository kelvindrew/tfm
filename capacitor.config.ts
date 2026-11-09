import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cd.tfm.scheduler',
  appName: 'TFM Scheduler',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
