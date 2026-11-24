import { test, expect } from './fixtures.js';

// Exercise the download fallback used by browsers without a native save picker.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { window.showSaveFilePicker = undefined; });
});

test('barra superior abre, salva, executa e interrompe com atalhos e menus preservados', async ({ page }) => {
  await page.goto('/app/');
  const menu = async (name, item) => {
    await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('button', { name, exact: true }).click();
    await page.getByRole('menuitem', { name: item }).click();
  };
  const controls = page.getByRole('toolbar', { name: 'Execução' });
  const screens = page.getByRole('navigation', { name: 'Telas' });
  // Run controls live in the top bar; the left bar only switches screens.
  await expect(controls.getByRole('button', { name: 'Executar programa', exact: true })).toBeVisible();
  await expect(screens.getByRole('button', { name: 'Executar programa' })).toHaveCount(0);
  await screens.getByRole('button', { name: 'Abrir ajuda', exact: true }).click();
  await expect(screens.getByRole('button', { name: 'Abrir ajuda', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Novo programa/ }).click();
  await expect(screens.getByRole('button', { name: 'Mostrar editor', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const picker = page.waitForEvent('filechooser');
  await menu('Arquivo', /Abrir arquivo/);
  await (await picker).setFiles({ name: 'lateral.por', mimeType: 'text/plain', buffer: Buffer.from('programa { inclua biblioteca Util --> u funcao inicio() { escreva("Iniciou") enquanto (verdadeiro) { u.aguarde(20) } } }') });
  await expect(page.getByRole('tab', { name: 'lateral.por' })).toBeVisible();
  const download = page.waitForEvent('download');
  await menu('Arquivo', /^Salvar\s*Ctrl/);
  expect((await download).suggestedFilename()).toBe('lateral.por');
  await controls.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.locator('.ide-status')).toContainText('Executando');
  await expect(controls.getByRole('button', { name: 'Executar programa', exact: true })).toBeDisabled();
  await controls.getByRole('button', { name: 'Parar execução', exact: true }).click();
  await expect(page.locator('.ide-status')).toContainText('Interrompido');
  await expect(controls.getByRole('button', { name: 'Executar programa', exact: true })).toBeEnabled();
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
  await expect(controls.getByRole('button', { name: 'Executar programa', exact: true })).toBeVisible();
  await expect(screens).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/command-rail-mobile.png' });
});
