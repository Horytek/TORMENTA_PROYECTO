import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve('./src') } },
  optimizeDeps: {
    exclude: [
      'html2pdf.js',
      'html2pdf.js/dist/html2pdf.bundle.js',
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