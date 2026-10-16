import { test, expect } from '@playwright/test';

test('home preserva a árvore, expande subcategorias e busca no celular', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  const tree = page.getByLabel('Categorias dos exemplos');
  const libraries = tree.getByRole('button', { name: /^Bibliotecas/ });
  await expect(libraries).toHaveAttribute('aria-expanded', 'false');
  await libraries.click();
  await expect(libraries).toHaveAttribute('aria-expanded', 'true');
  const graphics = tree.getByRole('button', { name: /^Graficos/ });
  await graphics.click();
  await expect(graphics).toHaveAttribute('aria-expanded', 'true');
  await expect(tree.getByRole('button', { name: 'Solar', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/home-tree-desktop.png' });
  await libraries.click();
  await expect(tree.getByRole('button', { name: 'Solar', exact: true })).toHaveCount(0);
  await page.getByLabel('Buscar exemplos').fill('blocos');
  await expect(tree.getByRole('button', { name: /blocos 2D/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/home-tree-mobile.png' });
  await tree.getByRole('button', { name: /blocos 2D/ }).click();
  await expect(page.locator('.cm-editor')).toBeVisible();
});
