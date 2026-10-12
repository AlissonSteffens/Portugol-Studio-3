import { test, expect } from '@playwright/test';

test('prévia indisponível usa a apresentação de exemplo sem imagem', async ({ page }) => {
  await page.route('**/exemplos/index.json', route => route.fulfill({ json: [
    { id: 'broken', nome: 'Imagem indisponível', categoria: 'Jogos', arquivo: 'serpente.por', imagem: 'missing.png' },
    { id: 'plain', nome: 'Sem imagem', categoria: 'Jogos', arquivo: 'plain.por' },
    { id: 'valid', nome: 'Imagem válida', categoria: 'Jogos', arquivo: 'valid.por', imagem: 'valid.svg' },
  ] }));
  await page.route('**/exemplos/missing.png', route => route.fulfill({ status: 404, body: '' }));
  await page.route('**/exemplos/valid.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="yellow"/></svg>' }));
  await page.goto('/');
  const catalog = page.locator('.welcome-example-list');
  const broken = catalog.getByRole('button', { name: 'Imagem indisponível Jogos' });
  await broken.scrollIntoViewIfNeeded();
  await expect(broken.locator('.welcome-file-icon')).toBeVisible();
  await expect(broken.locator('img')).toHaveCount(0);
  await expect(broken.locator('.welcome-catalog-preview')).toHaveCount(0);
  await expect(catalog.getByRole('button', { name: 'Sem imagem Jogos' }).locator('.welcome-file-icon')).toBeVisible();
  await expect(catalog.getByRole('button', { name: /Imagem válida/ }).locator('.welcome-catalog-preview img')).toBeVisible();
  await expect(page.locator('.welcome-featured img')).toHaveCount(0);
  await page.getByLabel('Buscar exemplos').fill('Imagem indisponível');
  await expect(broken.locator('.welcome-file-icon')).toBeVisible();
});
