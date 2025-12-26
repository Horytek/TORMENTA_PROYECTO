import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    rollupOptions: { output: {} },
    commonjsOptions: { transformMixedEsModules: true }
  }
})