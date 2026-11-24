import { test, expect } from '@playwright/test';

// Default behaviour (no panel fixture): graphics programs run in their own tab.
const graphics = 'programa { inclua biblioteca Graficos --> g inclua biblioteca Util --> u funcao inicio() { g.iniciar_modo_grafico() escreva("gráfico") enquanto (verdadeiro) { g.limpar() g.renderizar() u.aguarde(20) } } }';
const text = 'programa { funcao inicio() { escreva("só texto") } }';

async function editor(page, code) {
  await page.goto('/app/');
  await page.getByRole('button', { name: /Novo programa/ }).click();
  await page.locator('.cm-content').fill(code);
}

test('programa gráfico abre em outra aba, reaproveita a aba e fechar encerra', async ({ page }) => {
  await editor(page, graphics);
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  const popup = await popupPromise;
  await expect(popup.getByLabel('Tela gráfica Portugol')).toBeVisible();
  await expect(popup.getByLabel('Terminal de execução')).toContainText('gráfico');
  await expect(page.getByText('Execução aberta em outra aba')).toBeVisible();
  // The terminal travels with the game and can be collapsed there.
  const caption = popup.getByRole('button', { name: /Terminal/ });
  await caption.click();
  await expect(caption).toHaveAttribute('aria-expanded', 'false');
  // Running again reuses the same tab instead of opening another one.
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
  await expect(page.locator('.ide-status')).toContainText('Interrompido');
  let extra = false; page.on('popup', () => { extra = true; });
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.locator('.ide-status')).toContainText('Executando');
  expect(extra).toBe(false);
  expect(popup.isClosed()).toBe(false);
  await popup.close();
  await expect(page.locator('.ide-status')).toContainText('Interrompido');
  await expect(page.getByLabel('Terminal de execução')).toBeVisible();
});

test('programa de texto devolve a execução ao painel e depurar fica no editor', async ({ page }) => {
  await editor(page, graphics);
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  const popup = await popupPromise;
  await expect(popup.getByLabel('Tela gráfica Portugol')).toBeVisible();
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
  await page.locator('.cm-content').fill(text);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByLabel('Terminal de execução')).toContainText('só texto');
  await expect.poll(() => popup.isClosed()).toBe(true);
  // On the web, debugging a graphics program keeps it beside the code.
  await page.locator('.cm-content').fill(graphics);
  let opened = false; page.on('popup', () => { opened = true; });
  await page.getByRole('button', { name: 'Depurar', exact: true }).click();
  await expect(page.locator('.workspace-output').getByLabel('Tela gráfica Portugol')).toBeVisible();
  expect(opened).toBe(false);
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
});

test('preferência no menu Exibir mantém programas gráficos no painel', async ({ page }) => {
  await editor(page, graphics);
  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('button', { name: 'Exibir', exact: true }).click();
  const option = page.getByRole('menuitemcheckbox', { name: 'Programas gráficos em aba separada' });
  await expect(option).toHaveAttribute('aria-checked', 'true');
  await option.click();
  let opened = false; page.on('popup', () => { opened = true; });
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.locator('.workspace-output').getByLabel('Tela gráfica Portugol')).toBeVisible();
  await expect(page.getByLabel('Terminal de execução')).toContainText('gráfico');
  expect(opened).toBe(false);
  await page.reload();
  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('button', { name: 'Exibir', exact: true }).click();
  await expect(page.getByRole('menuitemcheckbox', { name: 'Programas gráficos em aba separada' })).toHaveAttribute('aria-checked', 'false');
});

test('erro de execução aparece também na aba do jogo', async ({ page }) => {
  await editor(page, 'programa { inclua biblioteca Graficos --> g funcao inicio() { inteiro zero = 0 g.iniciar_modo_grafico() g.renderizar() escreva(1 / zero) } }');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  const popup = await popupPromise;
  await expect(popup.getByRole('alert')).toBeVisible();
  await expect(popup.locator('header')).toContainText('Erro');
});
