import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/browser', use: { baseURL: 'http://127.0.0.1:4173', headless: true }, webServer: { command: 'node server/index.js', url: 'http://127.0.0.1:4173', env: { PORT: '4173', PORTUGOL_DATA_DIR: '.data/browser-tests' }, reuseExistingServer: false }, workers: 1 });
