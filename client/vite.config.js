import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false
    })
  ],
  server: {
    proxy: {
      '/api': {
        // Usa VITE_API_URL si existe; fallback a localhost:4000
        target: (process.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+api\/?$/, ''),
        changeOrigin: true,
        secure: false
      }
    }
  },
  envDir: '..',
  resolve: { alias: { '@': resolve('./src') } },
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]_[local]__[hash:base64:5]'
    }
  },
  optimizeDeps: {
    exclude: [
      '@botpress/webchat',
      '@botpress/chat'
    ]
  },
  assetsInclude: ['**/*.ogg', '**/*.mp3', '**/*.wav'],
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@heroui/react', 'framer-motion', 'lucide-react']
        }
      }
    },
    commonjsOptions: { transformMixedEsModules: true }
  }
})