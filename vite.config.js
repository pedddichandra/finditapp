import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true
      }
    }
  },
  build: {
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - cached separately
          'vendor-react': ['react', 'react-dom'],
          'vendor-animation': ['framer-motion', 'gsap'],
          'vendor-supabase': ['@supabase/supabase-js'],
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 600
  }
})
