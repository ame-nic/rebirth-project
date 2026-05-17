import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' lets the React hook decide when to apply updates —
      // user sees a "Nuova versione" toast and chooses to reload.
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: {
        config: true,
        overrideManifestIcons: true,
      },
      manifest: {
        name: 'Rebirth',
        short_name: 'Rebirth',
        description: 'Daily companion — training, nutrition, progress.',
        lang: 'it',
        theme_color: '#14110D',
        background_color: '#14110D',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          // ── Static asset CDNs (long TTL, version-pinned) ─────────────
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-css',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-static',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/unpkg\.com\/@phosphor-icons\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'phosphor-icons',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // ── Feed APIs (SWR — instant when cached, refresh in BG) ─────
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'weather-cache',
              expiration: { maxEntries: 4, maxAgeSeconds: 30 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.rss2json\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'rss-cache',
              expiration: { maxEntries: 40, maxAgeSeconds: 4 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/www\.reddit\.com\/r\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'reddit-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 2 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.allorigins\.win\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'cors-proxy-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 4 * 60 * 60 },
            },
          },
          // ── Feed thumbnails (cap'd so feed images don't grow the SW cache forever) ─
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
