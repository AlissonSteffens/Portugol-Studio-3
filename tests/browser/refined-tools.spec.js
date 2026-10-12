import { test, expect } from '@playwright/test';

test('fix discreto no painel e menu de correção no hover', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  const editor = page.locator('.cm-content');
  await editor.fill('programa {\n funcao inicio() {\n inteiro a = 3.45\n escreva(a)\n }\n}');
  await expect(page.locator('.diagnostic-row .diagnostic-fix')).toHaveText('Correção rápida');
  await page.locator('.cm-lintRange-warning').hover();
  const hover = page.locator('.cm-tooltip-lint');
  await expect(hover).toContainText('parte decimal');
  await hover.locator('.diagnostic-fix').click();
  await expect(hover.getByRole('button', { name: 'Usar real nesta declaração' })).toBeVisible();
  await page.screenshot({ path: 'test-results/quick-fix-hover.png' });
  await hover.getByRole('button', { name: 'Usar real nesta declaração' }).click();
  await expect(editor).toContainText('real a = 3.45');
  await expect(page.locator('.diagnostic-row')).toHaveCount(0);
  await editor.press('Control+z');
  await expect(editor).toContainText('inteiro a = 3.45');
});

test('recursos ocupam a lateral e se adaptam à largura e ao celular', async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 720 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await page.getByRole('button', { name: 'Mostrar recursos', exact: true }).click();
  await page.locator('input[type=file][multiple]').setInputFiles({ name: 'arquivo-com-nome-bem-longo-para-verificar-o-layout.txt', mimeType: 'text/plain', buffer: Buffer.from('teste') });
  await expect(page.locator('.resource-item')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Recolher repositório' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Configurar envio de arquivos' }).click();
  await expect(page.getByLabel('Pasta de destino')).toBeVisible();
  const overflow = () => page.locator('.resource-panel').evaluate(panel => panel.scrollWidth > panel.clientWidth);
  expect(await overflow()).toBe(false);
  const sidebar = await page.locator('.code-inspector').boundingBox(), panel = await page.locator('.resource-panel').boundingBox();
  expect(panel.width).toBeGreaterThan(sidebar.width - 3);
  await page.screenshot({ path: 'test-results/resources-sidebar.png' });
  await page.setViewportSize({ width: 360, height: 640 });
  await expect(page.locator('.resource-panel')).toBeVisible();
  expect(await overflow()).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByLabel('Buscar recursos').fill('bem-longo');
  await expect(page.locator('.resource-item')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/resources-mobile.png' });
});

test('aba de execução anima com o editor suspenso, recebe leia e restaura os elementos', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await page.locator('.cm-content').fill(`programa {
    inclua biblioteca Graficos --> g
    inclua biblioteca Teclado --> t
    funcao inicio() {
      inteiro n = 0
      inteiro valor
      g.iniciar_modo_grafico()
      enquanto (nao t.tecla_pressionada(t.TECLA_A)) {
        n++
        g.definir_cor(g.criar_cor(n % 255, 0, 0))
        g.limpar()
        escreva(n, "\\n")
        g.renderizar()
      }
      escreva("Valor: ")
      leia(valor)
      escreva("Recebido: ", valor)
    }
  }`);
  // Simulate a background editor whose requestAnimationFrame never fires.
  await page.evaluate(() => { window.originalFrame = window.requestAnimationFrame; window.requestAnimationFrame = callback => window.originalFrame(() => {}); });
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByLabel('Terminal de execução')).toHaveText('1\n');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Abrir em nova aba' }).click();
  const popup = await popupPromise; popup.on('pageerror', error => errors.push(error.message));
  await popup.bringToFront();
  await expect(popup.locator('canvas')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect.poll(async () => Number((await popup.getByLabel('Terminal de execução').innerText()).trim().split('\n').at(-1))).toBeGreaterThan(3);
  const pixel = await popup.locator('canvas').evaluate(canvas => canvas.getContext('2d').getImageData(0, 0, 1, 1).data[0]);
  expect(pixel).toBeGreaterThan(1);
  await popup.locator('canvas').focus(); await popup.keyboard.down('a');
  const input = popup.getByLabel('Terminal de execução').locator('input');
  await expect(input).toBeVisible(); await popup.keyboard.up('a');
  await input.fill('42'); await input.press('Enter');
  await expect(popup.getByLabel('Terminal de execução')).toContainText('Recebido: 42');
  await expect(popup.locator('header')).toContainText('Concluído');
  await page.evaluate(() => { window.requestAnimationFrame = window.originalFrame; });
  await popup.getByRole('button', { name: 'Trazer para o editor' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByLabel('Terminal de execução')).toContainText('Recebido: 42');
  expect(errors).toEqual([]);
});

test('fechar a aba durante leia devolve a entrada e parar cancela frames na nova aba', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await page.locator('.cm-content').fill('programa { inclua biblioteca Graficos --> g funcao inicio() { inteiro valor g.iniciar_modo_grafico() leia(valor) escreva(valor) } }');
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByLabel('Terminal de execução').locator('input')).toBeVisible();
  await page.getByRole('button', { name: 'Mostrar gráfico', exact: true }).click();
  let popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Abrir em nova aba' }).click();
  let popup = await popupPromise;
  await expect(popup.getByLabel('Terminal de execução').locator('input')).toBeVisible();
  await popup.close();
  const input = page.getByLabel('Terminal de execução').locator('input');
  await expect(input).toBeVisible(); await input.fill('7'); await input.press('Enter');
  await expect(page.getByText('● Concluído')).toBeVisible();
  await expect(page.getByLabel('Terminal de execução')).toContainText('7');
  await page.locator('.cm-content').fill('programa { inclua biblioteca Graficos --> g funcao inicio() { g.iniciar_modo_grafico() enquanto (verdadeiro) { g.renderizar() } } }');
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Abrir em nova aba' }).click();
  popup = await popupPromise;
  await popup.getByRole('button', { name: 'Parar execução' }).click();
  await expect(popup.locator('header')).toContainText('Interrompido');
  await popup.close();
  await expect(page.locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
