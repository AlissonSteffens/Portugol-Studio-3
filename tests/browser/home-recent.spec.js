import { test, expect } from '@playwright/test';

const key = 'portugol-studio-recent-examples';
const examples = Array.from({ length: 15 }, (_, i) => ({ id: `recent-${i}`, nome: `Exemplo ${i}`, categoria: 'Jogos', caminho: `recent/${i}.por`, arquivo: `${i}.por`, descricao: 'Um exemplo para praticar.', recursos: [] }));
test.beforeEach(async ({ page }) => {
  await page.route('**/exemplos/index.json', route => route.fulfill({ json: examples }));
  await page.route('**/exemplos/recent/*.por', route => route.fulfill({ body: 'programa { funcao inicio() { escreva("Teste") } }' }));
});

test('histórico é limitado, ordenado, sem duplicatas e persiste após recarregar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Exemplos acessados recentemente' })).toHaveCount(0);
  for (let i = 0; i < 10; i++) {
    await page.getByLabel('Buscar exemplos').fill(`Exemplo ${i}`);
    await page.getByRole('region', { name: 'Biblioteca de exemplos' }).getByRole('button', { name: `Exemplo ${i}`, exact: true }).click();
    await page.getByRole('tab', { name: 'Início', exact: true }).click();
  }
  const recent = page.getByRole('region', { name: 'Exemplos acessados recentemente' });
  await expect(recent.locator('.welcome-recent-grid > button')).toHaveCount(8);
  await expect(recent.locator('.welcome-recent-grid > button').first()).toHaveAccessibleName('Exemplo 9');
  await recent.getByRole('button', { name: 'Exemplo 5', exact: true }).click();
  await page.getByRole('tab', { name: 'Início', exact: true }).click();
  await expect(recent.locator('.welcome-recent-grid > button').first()).toHaveAccessibleName('Exemplo 5');
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)).toEqual(['recent-5', 'recent-9', 'recent-8', 'recent-7', 'recent-6', 'recent-4', 'recent-3', 'recent-2']);
  await page.reload();
  await expect(recent.locator('.welcome-recent-grid > button').first()).toHaveAccessibleName('Exemplo 5');
  await page.screenshot({ path: 'test-results/home-recent-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/home-recent-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await recent.getByRole('button', { name: 'Limpar histórico' }).click();
  await expect(recent).toHaveCount(0);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)).toEqual([]);
  await page.getByRole('button', { name: /Arquivos abertos \(/ }).click();
  await expect(page.locator('.welcome-session')).toBeVisible();
});

test('histórico inválido e falhas ao abrir não quebram a home', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{invalid'), key);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Explore os exemplos' })).toBeVisible();
  await page.getByLabel('Buscar exemplos').fill('Exemplo 2');
  await page.getByRole('region', { name: 'Biblioteca de exemplos' }).getByRole('button', { name: 'Exemplo 2', exact: true }).click();
  await page.getByRole('tab', { name: 'Início', exact: true }).click();
  await page.route('**/exemplos/recent/3.por', route => route.fulfill({ status: 404 }));
  await page.getByLabel('Buscar exemplos').fill('Exemplo 3');
  await page.getByRole('region', { name: 'Biblioteca de exemplos' }).getByRole('button', { name: 'Exemplo 3', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível abrir');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)).toEqual(['recent-2']);
});

test('histórico antigo ignora exemplos removidos e elimina duplicatas', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify(['removido', 'recent-1', 'recent-1'])), key);
  await page.goto('/');
  const recent = page.getByRole('region', { name: 'Exemplos acessados recentemente' });
  await expect(recent.locator('.welcome-recent-grid > button')).toHaveCount(1);
  await expect(recent.getByRole('button', { name: 'Exemplo 1', exact: true })).toBeVisible();
  await recent.getByRole('button', { name: 'Exemplo 1', exact: true }).click();
  await page.getByRole('tab', { name: 'Início', exact: true }).click();
  await expect(recent.locator('.welcome-recent-grid > button')).toHaveCount(1);
});
