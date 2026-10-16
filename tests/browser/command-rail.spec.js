import { test, expect } from '@playwright/test';

// Exercise the download fallback used by browsers without a native save picker.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { window.showSaveFilePicker = undefined; });
});

test('comandos laterais abrem, salvam, executam e interrompem com atalhos e menus preservados', async ({ page }) => {
  await page.goto('/');
  const rail = page.getByRole('complementary', { name: 'Comandos e ferramentas' });
  await expect(rail.getByRole('button', { name: 'Executar programa', exact: true })).toHaveCount(0);
  await expect(rail.getByRole('button', { name: 'Salvar arquivo', exact: true })).toHaveCount(0);
  await rail.getByRole('button', { name: 'Abrir ajuda', exact: true }).click();
  await expect(rail.getByRole('button', { name: 'Executar programa', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /Novo programa/ }).click();
  await expect(rail.getByRole('button', { name: 'Executar programa', exact: true })).toBeVisible();
  await expect(page.locator('.ide-toolbar').getByRole('button', { name: 'Executar programa' })).toHaveCount(0);
  const picker = page.waitForEvent('filechooser');
  await rail.getByRole('button', { name: 'Abrir arquivo', exact: true }).click();
  await (await picker).setFiles({ name: 'lateral.por', mimeType: 'text/plain', buffer: Buffer.from('programa { inclua biblioteca Util --> u funcao inicio() { escreva("Iniciou") enquanto (verdadeiro) { u.aguarde(20) } } }') });
  await expect(page.getByRole('tab', { name: 'lateral.por' })).toBeVisible();
  const download = page.waitForEvent('download');
  await rail.getByRole('button', { name: 'Salvar arquivo', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('lateral.por');
  await rail.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.locator('.ide-status')).toContainText('Executando');
  await expect(rail.getByRole('button', { name: 'Executar programa', exact: true })).toBeDisabled();
  await rail.getByRole('button', { name: 'Parar execução', exact: true }).click();
  await expect(page.locator('.ide-status')).toContainText('Interrompido');
  await expect(rail.getByRole('button', { name: 'Executar programa', exact: true })).toBeEnabled();
  await page.keyboard.press('Control+Enter');
  await expect(page.locator('.ide-status')).toContainText('Executando');
  await page.keyboard.press('Escape');
  await expect(page.locator('.ide-status')).toContainText('Interrompido');
  const keyboardDownload = page.waitForEvent('download');
  await page.keyboard.press('Control+s');
  expect((await keyboardDownload).suggestedFilename()).toBe('lateral.por');
  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('button', { name: 'Arquivo', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: /Salvar como/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(rail.getByRole('button', { name: 'Executar programa', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/command-rail-mobile.png' });
});
