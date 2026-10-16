import { test, expect } from '@playwright/test';
import { setEditorCode } from './helpers/editor.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.savedFiles = [];
    window.showSaveFilePicker = async options => {
      window.pickerOptions = options;
      if (window.pickerFailure) throw new DOMException('Falha no seletor', window.pickerFailure);
      return { name: 'escolhido.por', createWritable: async () => ({
        write: async blob => { if (window.writeFailure) throw new Error('Disco indisponível'); window.savedFiles.push(await blob.text()); },
        close: async () => {}, abort: async () => {},
      }) };
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await setEditorCode(page, 'programa { funcao inicio() { escreva("Salvar") } }');
});

test('salva pelo seletor nativo com nome escolhido e preserva o código', async ({ page }) => {
  await page.keyboard.press('Control+Shift+s');
  await expect(page.getByRole('tab', { name: 'escolhido.por' })).toBeVisible();
  expect(await page.evaluate(() => window.savedFiles[0])).toContain('escreva("Salvar")');
  expect(await page.evaluate(() => window.pickerOptions.types[0].accept)).toEqual({ 'text/plain': ['.por'] });
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('cancelar ou falhar ao salvar antes de fechar mantém a aba aberta', async ({ page }) => {
  await page.evaluate(() => { window.pickerFailure = 'AbortError'; });
  await page.keyboard.press('Control+s');
  expect(await page.evaluate(() => window.savedFiles)).toEqual([]);
  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('button', { name: 'Arquivo', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Fechar arquivo', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar e fechar', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => { window.pickerFailure = null; window.writeFailure = true; });
  await page.getByRole('button', { name: 'Salvar e fechar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Disco indisponível');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => { window.writeFailure = false; });
  await page.getByRole('button', { name: 'Salvar e fechar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => window.savedFiles.length)).toBe(1);
});

test('recursos e exportação também usam o seletor de destino', async ({ page }) => {
  await page.getByRole('button', { name: 'Mostrar recursos', exact: true }).click();
  await page.locator('input[type=file][multiple]').setInputFiles({ name: 'recurso.txt', mimeType: 'text/plain', buffer: Buffer.from('Conteúdo do recurso') });
  await page.getByRole('button', { name: 'Ações de recurso.txt', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar arquivo como…', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.savedFiles[0])).toBe('Conteúdo do recurso');
  expect(await page.evaluate(() => window.pickerOptions.suggestedName)).toBe('recurso.txt');
  await page.getByRole('button', { name: 'Exportar projeto', exact: true }).click();
  await page.getByRole('dialog', { name: 'Exportar projeto' }).getByRole('button', { name: 'Exportar projeto', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Arquivo salvo');
  expect(await page.evaluate(() => window.savedFiles[1])).toContain('<!doctype html>');
  expect(await page.evaluate(() => window.pickerOptions.suggestedName)).toMatch(/\.html$/);
});
