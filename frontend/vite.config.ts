import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@bookly/enums': path.resolve(__dirname, '../../packages/enums'),
      '@bookly/types': path.resolve(__dirname, '../../packages/types'),
    },
  },
  server: {
    port: 5173,
  },
});
