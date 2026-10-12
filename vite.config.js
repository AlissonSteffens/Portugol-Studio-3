import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { runtimePlugin } from './scripts/runtime-build.js';
export default defineConfig({ base: process.env.VITE_BASE_PATH || '/', plugins: [react(), tailwindcss(), runtimePlugin()] });
