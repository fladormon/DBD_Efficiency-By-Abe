import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 1420,
    strictPort: true,
    hmr: { overlay: false },
  },
  build: {
    target: ['chrome105'],
    outDir: 'dist',
    emptyOutDir: true,
  },
});