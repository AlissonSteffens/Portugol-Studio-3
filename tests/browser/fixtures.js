import { test as base, expect } from '@playwright/test';

// Graphics programs open in their own tab by default. Most specs exercise the runtime
// itself, so they keep it docked in the panel; execution-window.spec.js covers the tab.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      if (!localStorage.getItem('portugol-studio-graphics-target')) localStorage.setItem('portugol-studio-graphics-target', '"painel"');
    });
    await use(context);
  },
});
export { expect };
