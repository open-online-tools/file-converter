import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Deploy to GitHub Pages — set base to repo name if needed.
  // Override with VITE_BASE env var in CI.
  base: process.env.VITE_BASE || '/',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },

  worker: {
    format: 'es',
  },

  // Allow the WASM file to be served correctly in dev mode
  server: {
    headers: {
      // Required for SharedArrayBuffer (used by some WASM audio libs in future)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  // Tell Vite to treat .wasm files as assets
  assetsInclude: ['**/*.wasm'],

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
});
