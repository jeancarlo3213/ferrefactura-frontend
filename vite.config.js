import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    historyApiFallback: true, // Evita errores 404 en recargas
    host: true,
    port: 3000, // Asegura que el frontend se ejecute correctamente
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
