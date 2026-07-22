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
        // Función (no objeto): matchea por RUTA del módulo. La forma de objeto
        // solo capturaba `react-dom/index.js` y dejaba `react-dom/client.js` +
        // los internos (~130KB) fugarse al chunk principal. Devolver undefined
        // para el resto deja que Rollup mantenga lazy lo que solo usan rutas lazy
        // (jspdf, xlsx, html2canvas no deben volverse eager).
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // React + react-dom + scheduler + router SIEMPRE juntos (interdependientes).
          if (/[\\/]node_modules[\\/](react-dom|react-router-dom|react-router|scheduler|react)[\\/]/.test(id)) return 'react-vendor'
          if (/[\\/]node_modules[\\/](@tanstack[\\/]react-query|axios)[\\/]/.test(id)) return 'query-vendor'
          if (/[\\/]node_modules[\\/](framer-motion|lucide-react)[\\/]/.test(id)) return 'ui-vendor'
          if (/[\\/]node_modules[\\/](radix-ui|@radix-ui)[\\/]/.test(id)) return 'radix-vendor'
          if (/[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/.test(id)) return 'form-vendor'
          if (/[\\/]node_modules[\\/](recharts|d3-|internmap|victory-)[\\/]/.test(id)) return 'chart-vendor'
          if (/[\\/]node_modules[\\/]cmdk[\\/]/.test(id)) return 'command-vendor'
          // resto: undefined → Rollup decide (no se fuerza eager lo lazy).
        }
      }
    }
  }
})
