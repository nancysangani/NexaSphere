import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  resolve: {
    alias: {
      'next/image': '/src/shared/next-image.jsx',
      'next/dynamic': '/src/shared/next-dynamic.jsx',
    },
  },

  base: process.env.VITE_CDN_URL || process.env.VITE_BASE_PATH || '/',

  plugins: [
    react(),

    sentryVitePlugin({
      org: process.env.SENTRY_ORG || 'nexasphere',
      project: process.env.SENTRY_PROJECT || 'javascript-react',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
    }),

    process.env.ANALYZE === 'true' &&
      visualizer({
        filename: 'bundle-report.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),

    VitePWA({
      disable: process.env.DISABLE_PWA === 'true',

      // ── Use injectManifest so Workbox injects __WB_MANIFEST into our
      // custom sw-nexasphere.js, which defines all caching strategies.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw-nexasphere.js',

      // 'prompt' = new SW waits; UpdatePrompt asks user before activating.
      // This prevents the app from reloading mid-session unexpectedly.
      registerType: 'prompt',

      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],

      manifest: {
        name: 'NexaSphere — Connecting GL Bajaj Tech Ecosystem',
        short_name: 'NexaSphere',
        description: 'The premier tech community of GL Bajaj Group of Institutions.',
        theme_color: '#CC1111',
        background_color: '#0A0A0A',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },

      injectManifest: {
        // 4 MB limit to handle large vendor chunks (TensorFlow.js, FullCalendar)
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webp,woff2}'],
        // Exclude source maps and large ML models from precache manifest
        globIgnores: ['**/*.map', '**/tensorflow*', '**/tfjs*'],
      },

      devOptions: {
        // Enable in dev by setting SW_DEV=true to test caching strategies locally
        enabled: process.env.SW_DEV === 'true',
        type: 'module',
      },
    }),
  ],

  optimizeDeps: {
    include: ['idb-keyval', 'dompurify'],
  },

  build: {
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      external: [],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom'))
              return 'vendor-react';
            if (id.includes('framer-motion')) return 'vendor-framer';
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('@tensorflow/tfjs')) return 'vendor-tensorflow';
            if (id.includes('@fullcalendar')) return 'vendor-fullcalendar';
            if (id.includes('@sentry')) return 'vendor-sentry';
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify'))
              return 'vendor-pdf';
            if (
              id.includes('i18next') ||
              id.includes('react-i18next') ||
              id.includes('i18next-browser')
            )
              return 'vendor-i18n';
          }
        },
      },
    },
  },

  server: {
    port: 5175,
    proxy: {
      '/api': 'http://localhost:8787',
      '/healthz': 'http://localhost:8787',
    },
  },
});
