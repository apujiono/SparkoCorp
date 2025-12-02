import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Using default esbuild minification which is faster and doesn't require extra deps
  },
  server: {
    port: 3000
  }
});