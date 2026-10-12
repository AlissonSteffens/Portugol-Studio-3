import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createRepositoryHandler } from './server/repository.js';
import { internetHandler } from './server/internet.js';
import { runtimePlugin } from './scripts/runtime-build.js';
import { executableHandler } from './server/export.js';
export default defineConfig({ plugins: [react(), tailwindcss(), runtimePlugin(), {
  name: 'repositorio-arquivos',
  configureServer(server) {
    const handler = createRepositoryHandler();
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/export/executable') executableHandler(req, res);
      else if (req.url.startsWith('/api/files')) handler(req, res);
      else if (req.url.startsWith('/api/internet?')) internetHandler(req, res);
      else next();
    });
  },
}] });
