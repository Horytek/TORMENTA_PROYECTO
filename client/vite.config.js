import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve('./src/'),
    },
    build: {
      outDir: 'dist', // Aquí es donde se generarán los archivos estáticos
    },
  },
});