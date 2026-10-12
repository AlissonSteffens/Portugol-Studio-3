import { test, expect } from '@playwright/test';
import { setEditorCode } from './helpers/editor.js';

test('mensagens, navegação, sublinhados e valores da árvore', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await setEditorCode(page, 'programa {\n funcao inicio() {\n inteiro sobra = 0\n escreva(naoDeclarada)\n }\n}');
  await expect(page.locator('.diagnostic-row.error')).toContainText('Símbolo não declarado');
  await expect(page.locator('.cm-lintRange-error')).toBeVisible();
  await expect(page.locator('.cm-lintRange-warning')).toBeVisible();
  await page.locator('.cm-lintRange-error').hover();
  await expect(page.locator('.cm-tooltip-lint')).toContainText('Símbolo não declarado');
  await page.locator('.diagnostic-row.error').click();
  await expect(page.locator('.ide-status')).toContainText('Lin 4');
  await setEditorCode(page, 'programa { funcao inicio() { inteiro valor = 2 valor += 3 } }');
  await expect(page.locator('.diagnostic-row')).toHaveCount(0);
  await page.getByRole('button', { name: 'Árvore do código', exact: true }).click();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByText('● Concluído')).toBeVisible();
  await expect(page.locator('.symbol-value')).toHaveText('5');
});


test('valores durante leia e diagnóstico de execução na linha do código', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await setEditorCode(page, 'programa {\n funcao inicio() {\n inteiro valor = 2\n leia(valor)\n valor += 3\n }\n}');
  await page.getByRole('button', { name: 'Árvore do código', exact: true }).click();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByText('● Executando')).toBeVisible();
  await expect(page.locator('.symbol-value')).toHaveText('2');
  const input = page.getByLabel('Terminal de execução').locator('input');
  await input.fill('7'); await input.press('Enter');
  await expect(page.locator('.symbol-value')).toHaveText('10');
  await setEditorCode(page, 'programa {\n funcao inicio() {\n inteiro valor = 1 / 0\n }\n}');
  await page.getByRole('button', { name: /Mensagens/ }).click();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.locator('.diagnostic-row.error')).toContainText('Execução:');
  await expect(page.locator('.diagnostic-row.error')).toContainText('Linha 3');
});


test('seleção visível com mouse e teclado permite substituir texto; real para inteiro avisa', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  const editor = page.locator('.cm-content');
  await setEditorCode(page, 'programa {\n funcao inicio() {\n inteiro a = 3.45\n escreva(a)\n }\n}');
  await expect(page.locator('.diagnostic-row.warning')).toContainText('parte decimal será descartada');
  const number = page.locator('.cm-lintRange-warning');
  await expect(number).toHaveText('3.45');
  await number.hover();
  await expect(page.locator('.cm-tooltip-lint')).toContainText('parte decimal');
  const name = page.locator('.cm-line').first();
  await name.dblclick({ position: { x: 15, y: 8 } });
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('programa');
  await expect(page.locator('.cm-selectionBackground').first()).toBeVisible();
  const background = await page.locator('.cm-selectionBackground').first().evaluate(el => getComputedStyle(el).backgroundColor);
  expect(background).toBe('rgb(54, 93, 133)');
  await page.keyboard.insertText('programa');
  await editor.press('Control+Home');
  await editor.press('Control+Shift+ArrowRight');
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('programa');
  await editor.press('Control+a');
  await page.keyboard.insertText('programa { funcao inicio() { inteiro a = 3 escreva(a) } }');
  await expect(page.locator('.diagnostic-row')).toHaveCount(0);
  await expect(editor).toHaveText('programa { funcao inicio() { inteiro a = 3 escreva(a) } }');
});

test('vários diagnósticos Java aparecem juntos e a execução aguarda sua correção', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await setEditorCode(page, 'programa {\n funcao inicio() {\n const inteiro valor = 1\n valor = 2\n se(1) escreva(desconhecido)\n }\n}');
  for (const code of ['ErroAtribuirEmConstante', 'ErroTiposIncompativeis', 'ErroSimboloNaoDeclarado']) await expect(page.locator(`[data-diagnostic-code="ErroSemantico.${code}"]`)).toBeVisible();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Corrija os erros indicados');
  await page.locator('[data-diagnostic-code="ErroSemantico.ErroAtribuirEmConstante"]').click();
  await expect(page.locator('.ide-status')).toContainText('Lin 4');
  await setEditorCode(page, 'programa { funcao inicio() { inteiro valor=1 se(valor == 1) escreva(valor) } }');
  await expect(page.locator('.diagnostic-row.error')).toHaveCount(0);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByText('● Concluído')).toBeVisible();
});

test('Objetos analisa JSON/XML e apresenta mensagem localizada para JSON inválido', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await setEditorCode(page, 'programa { inclua biblioteca Objetos --> o funcao inicio() { inteiro id=o.criar_objeto_via_xml("<pessoa><nome>Maria</nome></pessoa>") escreva(o.obter_propriedade_tipo_cadeia(id,"nome")) } }');
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByText('● Concluído')).toBeVisible();
  await expect(page.getByLabel('Terminal de execução')).toContainText('Maria');
  await setEditorCode(page, 'programa {\n inclua biblioteca Objetos --> o\n funcao inicio() {\n inteiro id=o.criar_objeto_via_json("{")\n escreva(id)\n }\n}');
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.locator('[data-diagnostic-code="ErroExecucao.ErroExecucaoBiblioteca"]')).toContainText('Linha 4');
  await expect(page.locator('.diagnostic-row.error')).toContainText('Verifique a sintaxe do JSON');
});
