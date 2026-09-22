import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// Base path is configurable for GitHub Pages (e.g. VITE_BASE=/klev55/).
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'favicon.png', 'og.jpg'],
      manifest: {
        name: 'Клёв 55 — карта и прогноз рыбалки',
        short_name: 'Клёв 55',
        description: 'Карта, прогноз клёва и правила рыбалки в 200 км от Омска',
        lang: 'ru',
        theme_color: '#173B4F',
        background_color: '#F4F6F7',
        display: 'standalone',
        start_url: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,json,geojson,woff2}'],
        globIgnores: ['**/*-greek*', '**/*-vietnamese*', '**/*-latin-ext*'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            // Open-Meteo: network first, keep the last forecast for offline use.
            urlPattern: /^https:\/\/(api|archive-api)\.open-meteo\.com\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'weather', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 3 } },
          },
          {
            // Vector tiles for the region: cache what the user has seen (see D-007).
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\//,
            handler: 'CacheFirst',
            options: { cacheName: 'tiles', expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /^https:\/\/upload\.wikimedia\.org\//,
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
          {
            urlPattern: /^https:\/\/(static\.)?inaturalist\.org\//,
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173 },
  // MapLibre 6 resolves its worker via new URL('./maplibre-gl-worker.mjs', import.meta.url);
  // pre-bundling breaks that path in dev, so serve it straight from node_modules.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: { output: { manualChunks: (id: string) => (id.includes('maplibre-gl') ? 'maplibre' : undefined) } },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
});
