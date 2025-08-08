import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  root: '.',
  server: {
    port: 1420,
    strictPort: true,
    hmr: {
      overlay: false,
    },
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  build: {
    target: [
      process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'es2020'
    ],
    outDir: 'dist',
    emptyOutDir: true,
  },
}));