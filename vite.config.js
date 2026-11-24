import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { runtimePlugin } from './scripts/runtime-build.js';

const page = file => fileURLToPath(new URL(file, import.meta.url));
// The site home lives at the base path; the IDE is served from app/.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss(), runtimePlugin()],
  build: { rollupOptions: { input: { home: page('./index.html'), app: page('./app/index.html') } } },
});
