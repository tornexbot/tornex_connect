import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer'], // Polyfill Buffer specifically
    }),
  ],
  base: process.env.VITE_BASE_PATH || "/tornex-dapp",
});