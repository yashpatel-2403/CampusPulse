import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },

  build: {
    // Raise the warning threshold so Vite doesn't warn during CI
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split large vendor libs into separate chunks for better caching
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion':  ['framer-motion'],
          'vendor-charts':  ['recharts'],
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
          'vendor-socket':  ['socket.io-client'],
          'vendor-forms':   ['react-hook-form', 'axios'],
        },
      },
    },
  },
});
