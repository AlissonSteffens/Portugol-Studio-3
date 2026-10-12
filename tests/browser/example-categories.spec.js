import { test, expect } from '@playwright/test';

test('home organiza categorias, expande subcategorias e aproveita a largura', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const tree = page.getByLabel('Categorias dos exemplos');
  const libraries = tree.getByRole('button', { name: /^Bibliotecas/ });
  await expect(libraries).toHaveAttribute('aria-expanded', 'false');
  await libraries.click();
  await expect(libraries).toHaveAttribute('aria-expanded', 'true');
  const graphics = tree.getByRole('button', { name: /^Graficos/ });
  await graphics.click();
  await expect(tree.locator('.welcome-example-list').filter({ visible: true }).first()).toBeVisible();
  const content = await page.locator('.welcome-content').boundingBox();
  const catalog = await page.locator('.welcome-catalog').boundingBox();
  expect(content.width - catalog.width).toBeLessThan(70);
  await page.locator('.welcome-catalog').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/example-categories-desktop.png' });
  await page.getByLabel('Buscar exemplos').fill('blocos');
  await expect(tree.getByRole('button', { name: /blocos 2D/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.welcome-catalog').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/example-categories-mobile.png' });
  await tree.getByRole('button', { name: /blocos 2D/ }).click();
  await expect(page.locator('.cm-editor')).toBeVisible();
});

