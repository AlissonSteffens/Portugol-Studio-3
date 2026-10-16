import { test, expect } from '@playwright/test';

const source = 'programa { funcao inicio() { escreva("Teste") } }';
async function setup(page, dirty = []) {
  await page.addInitScript(({ source, dirty }) => {
    const documents = ['a', 'b', 'c', 'd'].map(id => ({ id, filename: id + '.por', code: source + (dirty.includes(id) ? '\n// alterado' : ''), savedCode: source, exampleId: '' }));
    localStorage.setItem('portugol-studio-documents-v1', JSON.stringify({ documents, activeId: 'b' }));
    localStorage.setItem('portugol-studio-home', 'false');
    window.showSaveFilePicker = async () => {
      if (window.cancelSave) throw new DOMException('Cancelado', 'AbortError');
      return { name: 'salvo.por', createWritable: async () => ({ write: async blob => { window.savedSource = await blob.text(); }, close: async () => {} }) };
    };
  }, { source, dirty });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Executar programa', exact: true })).toBeEnabled();
}
const tab = (page, name) => page.getByRole('tab', { name: new RegExp('^' + name + '\\.por') });
async function action(page, name, label) {
  await tab(page, name).click({ button: 'right' });
  await page.getByRole('menuitem', { name: label, exact: true }).click();
}

test('menu fecha à direita e à esquerda da aba clicada sem trocar a aba ativa', async ({ page }) => {
  await setup(page);
  await tab(page, 'c').click({ button: 'right' });
  await expect(tab(page, 'b')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('menuitem', { name: 'Fechar outras abas', exact: true })).toBeEnabled();
  await page.getByRole('menuitem', { name: 'Fechar abas à direita', exact: true }).click();
  await expect(tab(page, 'd')).toHaveCount(0);
  await action(page, 'c', 'Fechar abas à esquerda');
  await expect(tab(page, 'a')).toHaveCount(0);
  await expect(tab(page, 'b')).toHaveCount(0);
  await expect(tab(page, 'c')).toHaveAttribute('aria-selected', 'true');
  await tab(page, 'c').press('Shift+F10');
  await expect(page.getByRole('menuitem', { name: 'Fechar outras abas', exact: true })).toBeDisabled();
  await expect(page.getByRole('menuitem', { name: 'Fechar abas à direita', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(tab(page, 'c')).toBeFocused();
});

test('fechar outras e todas mantém Início e oferece um novo documento ao esvaziar', async ({ page }) => {
  await setup(page);
  await action(page, 'b', 'Fechar outras abas');
  await expect(page.getByRole('tab')).toHaveCount(2);
  await expect(tab(page, 'b')).toBeVisible();
  await action(page, 'b', 'Fechar todas as abas');
  await expect(tab(page, 'b')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Início', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'sem_titulo.por', exact: true })).toBeVisible();
});

test('fechamento em lote confirma cada alteração e cancelar interrompe os próximos', async ({ page }) => {
  await setup(page, ['b', 'c', 'd']);
  await action(page, 'a', 'Fechar outras abas');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('b.por');
  await dialog.getByRole('button', { name: 'Descartar e fechar' }).click();
  await expect(dialog).toContainText('c.por');
  await page.evaluate(() => { window.cancelSave = true; });
  await dialog.getByRole('button', { name: 'Salvar e fechar', exact: true }).click();
  await expect(dialog).toContainText('c.por');
  await expect(tab(page, 'c')).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(tab(page, 'b')).toHaveCount(0);
  await expect(tab(page, 'c')).toHaveCount(1);
  await expect(tab(page, 'd')).toHaveCount(1);
  await page.evaluate(() => { window.cancelSave = false; });
  await action(page, 'c', 'Fechar aba');
  await dialog.getByRole('button', { name: 'Salvar e fechar', exact: true }).click();
  await expect(tab(page, 'c')).toHaveCount(0);
  expect(await page.evaluate(() => window.savedSource)).toContain('// alterado');
});

test('menu aceita teclado, fecha ao clicar fora e não sai da tela', async ({ page }) => {
  await setup(page);
  await tab(page, 'b').focus();
  await page.keyboard.press('Shift+F10');
  await expect(page.getByRole('menuitem', { name: 'Fechar aba', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Fechar outras abas', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await tab(page, 'b').dispatchEvent('contextmenu', { clientX: 1279, clientY: 719 });
  const rect = await page.getByRole('menu').boundingBox();
  expect(rect.x + rect.width).toBeLessThanOrEqual(1280);
  expect(rect.y + rect.height).toBeLessThanOrEqual(720);
  await page.screenshot({ path: 'test-results/tab-context-menu.png' });
  await page.locator('.editor-heading').click();
  await expect(page.getByRole('menu')).toHaveCount(0);
});
