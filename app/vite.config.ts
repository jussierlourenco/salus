import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Salus — Central de Saúde da Família',
        short_name: 'Salus',
        description: 'Organize o histórico de saúde de toda a família — pessoas e animais.',
        start_url: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        theme_color: '#0d9488',
        background_color: '#0f172a',
        lang: 'pt-BR',
        orientation: 'portrait-primary',
        categories: ['health', 'medical', 'family'],
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
})
