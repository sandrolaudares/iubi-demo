import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em dev, /api (chat de IA) e /iubi (proxy do gateway IUBI) vão para o servidor
// Express, mantendo a chave Groq no servidor e evitando mixed-content/CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/iubi': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
