import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: 'static.spec.js', workers: 1,
  use: { baseURL: 'http://127.0.0.1:4174/Portugol-Studio-3/', headless: true },
  webServer: { command: 'node server/index.js', url: 'http://127.0.0.1:4174/Portugol-Studio-3/', env: { PORT: '4174', BASE_PATH: '/Portugol-Studio-3/' }, reuseExistingServer: false },
});
