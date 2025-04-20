import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  base: './', // <-- add this line
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer'], // Polyfill Buffer specifically
    }),
  ],
});
