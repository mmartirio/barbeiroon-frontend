import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://191.252.228.245:3001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
          });
        },
      },
      '/uploads': {
        target: 'http://191.252.228.245:3001',
        changeOrigin: true,
      },
    },
  },
  build: { outDir: 'dist' },
});
