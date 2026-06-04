import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.png', 'icon.png', 'logo.png'],
      manifest: {
        name: 'Barbeiro On',
        short_name: 'BarbeiroOn',
        description: 'Plataforma de agendamento para barbearias',
        theme_color: '#18191a',
        background_color: '#18191a',
        display: 'standalone',
        start_url: '/login',
        scope: '/',
        orientation: 'portrait',
        lang: 'pt-BR',
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Pré-cacheia todos os assets do build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Não intercepta requisições de API ou uploads
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        runtimeCaching: [
          {
            // API: network-first com fallback de 10s
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 5 * 60, // 5 min
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Uploads/imagens: cache-first
            urlPattern: /\/uploads\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts e outros CDNs (se usados no futuro)
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://api-barbeiroon.com.br',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
          });
        },
      },
      '/uploads': {
        target: 'https://api-barbeiroon.com.br',
        changeOrigin: true,
      },
    },
  },
  build: { outDir: 'dist' },
});
