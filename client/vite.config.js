import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': resolve('./src') } },
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]_[local]__[hash:base64:5]'
    }
  },
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