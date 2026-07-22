import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths()
  ],
  server: {
    proxy: {
      '/api': {
        target: (process.env.VITE_API_URL && process.env.VITE_API_URL.startsWith('http'))
          ? process.env.VITE_API_URL.replace(/\/+api\/?$/, '')
          : 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  envDir: '..',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  assetsInclude: ['**/*.ogg', '**/*.mp3', '**/*.wav'],
  build: {
    target: 'es2022',
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query', 'axios'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          // Vendors app-wide que estaban inflando el chunk principal. Separarlos
          // reduce el parseo inicial y permite cachearlos entre deploys de la app.
          'radix-vendor': ['radix-ui'],
          'form-vendor': ['react-hook-form', 'zod'],
          'chart-vendor': ['recharts'], // dedup entre dashboard/reports (solo carga en esas rutas)
          'command-vendor': ['cmdk']
        }
      }
    }
  }
})
