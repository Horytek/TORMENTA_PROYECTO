import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'

/**
 * `envDir: '..'` hace que Vite lea el .env de la raíz, que es del BACKEND y
 * trae `NODE_ENV=development`. Vite lo toma para decidir el modo, así que un
 * `npm run build` local salía compilado en desarrollo: React en versión de
 * desarrollo, `import.meta.env.PROD` en false y, por lo tanto, el service
 * worker sin registrarse — todo sin un solo aviso.
 *
 * En CI no pasaba porque el workflow escribe un .env nuevo solo con las
 * VITE_*, pero cualquier build local mentía, y un dist compilado a mano y
 * subido habría llevado React de desarrollo a producción.
 *
 * El modo lo decide el comando, no una variable del backend.
 */
// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const esBuild = command === 'build';

  return {
  // Se fuerzan los valores en vez de dejar que Vite los infiera del NODE_ENV
  // que trae el .env compartido. `command` es la verdad: `vite build` es
  // producción y `vite dev` no, sin importar qué diga el archivo del backend.
  define: esBuild
    ? {
        'process.env.NODE_ENV': '"production"',
        'import.meta.env.PROD': 'true',
        'import.meta.env.DEV': 'false',
      }
    : {},
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
  };
})
