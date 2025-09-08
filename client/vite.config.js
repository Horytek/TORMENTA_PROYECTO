import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve('./src') } },
  optimizeDeps: {
    exclude: [
      'html2pdf.js',
      'html2pdf.js/dist/html2pdf.bundle.js'
    ]
  },
  build: {
    target: 'es2020',          // BigInt soportado
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Forzar no dividir chunks si aún quieres 1 bundle (opcional):
        // manualChunks: undefined
      }
    },
    commonjsOptions: { transformMixedEsModules: true }
  }
})