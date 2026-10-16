import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const metadata = '/* $$$ Portugol Studio $$$\n * @POSICAO-CURSOR = 932;\n * @DOBRAMENTO-CODIGO = [1];\n */';
const code = '// Comentário normal\nprograma { funcao inicio() { escreva("Teste") } }\n';

// Exercise the download fallback used by browsers without a native save picker.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { window.showSaveFilePicker = undefined; });
});

test('abrir e salvar .por mantém metadados fora do editor e dentro do arquivo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await page.locator('input[type=file][accept=".por"]').setInputFiles({ name: 'metadados.por', mimeType: 'text/plain', buffer: Buffer.from(code + '\n' + metadata + '\n') });
  const editor = page.locator('.cm-content');
  await expect(editor).toContainText('Comentário normal');
  await expect(editor).not.toContainText('@POSICAO-CURSOR');
  await expect(editor).not.toContainText('$$$');
  await expect(page.getByRole('tab', { name: 'metadados.por', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByText('● Concluído')).toBeVisible();
  await expect(page.getByLabel('Terminal de execução')).toContainText('Teste');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Salvar arquivo', exact: true }).click();
  const downloaded = await downloadPromise;
  expect(await readFile(await downloaded.path(), 'utf8')).toBe(code + '\n' + metadata + '\n');
  await page.reload();
  await expect(editor).toContainText('Comentário normal');
  await expect(editor).not.toContainText('@POSICAO-CURSOR');
});

test('sessão antiga e exemplos Java abrem sem exibir seus metadados', async ({ page }) => {
  await page.addInitScript(({ code, metadata }) => {
    const source = code + '\n' + metadata;
    localStorage.setItem('portugol-studio-documents-v1', JSON.stringify({ activeId: 'old', documents: [{ id: 'old', filename: 'antigo.por', code: source, savedCode: source }] }));
  }, { code, metadata });
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await expect(page.locator('.cm-content')).not.toContainText('$$$');
  await expect(page.getByRole('tab', { name: 'antigo.por', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tela inicial', exact: true }).click();
  await page.getByLabel('Buscar exemplos').fill('Olá mundo');
  await page.locator('.welcome-example-list').getByRole('button', { name: /mundo/i }).first().click();
  await expect(page.locator('.cm-content')).toContainText('escreva');
  await expect(page.locator('.cm-content')).not.toContainText('@POSICAO-CURSOR');
  await expect(page.locator('.cm-content')).not.toContainText('$$$');
});
