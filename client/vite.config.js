import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve('./src') },
  },
  optimizeDeps: { force: true },
  build: {
    sourcemap: false,
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('react')) return 'react'
          if (id.includes('jspdf')) return 'pdf'
          if (id.includes('html2canvas') || id.includes('html2pdf')) return 'html2'
          if (id.includes('dompurify')) return 'sanitize'
          if (id.includes('@radix-ui')) return 'radix' // agrupa cualquier radix instalado
          return 'vendor'
        },
      },
    },
  },
  server: {
    https: true,
  },
})