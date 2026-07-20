import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The AI chat requests (/api/*) are proxied to the local Express server so the
// Groq API key stays server-side. IUBI REST APIs are called directly from the
// browser (they send permissive CORS headers).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
