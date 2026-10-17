import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { setEditorCode } from './helpers/editor.js';

async function openExample(page) {
  await page.goto('/');
  await page.getByLabel('Buscar exemplos').fill('Conheça seu navegador');
  await page.locator('.welcome-example-list').getByRole('button', { name: /Conheça seu navegador/ }).click();
}

test('exemplo consulta o ambiente real e a mesma biblioteca funciona no HTML exportado', async ({ page, context }) => {
  await page.addInitScript(() => { window.showSaveFilePicker = undefined; });
  await page.setViewportSize({ width: 1280, height: 800 });
  await openExample(page);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  const output = page.getByLabel('Terminal de execução');
  await expect(output).toContainText('MEU AMBIENTE DE EXECUÇÃO');
  await expect(output).toContainText('Celular: falso');
  await expect(output).toContainText('Mouse ou apontador preciso: verdadeiro');
  await expect(output).toContainText('Janela: 1280 x 800');
  await expect(output).toContainText('Orientação da janela: paisagem');
  await expect(output).toContainText(/Navegador: (Chrome|Chromium)/);
  await expect(page.locator('.touch-controls')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(output).toContainText('Celular: falso');
  await expect(output).toContainText('Janela: 390 x 844');
  await page.getByRole('button', { name: 'Exportar projeto', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('dialog', { name: 'Exportar projeto' }).getByRole('button', { name: 'Exportar projeto', exact: true }).click();
  const file = test.info().outputPath('navegador.html');
  await (await pending).saveAs(file);
  const player = await context.newPage();
  await player.setViewportSize({ width: 640, height: 480 });
  await player.goto(pathToFileURL(file).href);
  await player.getByRole('button', { name: 'Executar', exact: true }).click();
  await expect(player.getByLabel('Console')).toContainText('Janela: 640 x 480');
  await expect(player.getByLabel('Console')).toContainText(/Navegador: (Chrome|Chromium)/);
  await expect(player.locator('#status')).toHaveText('Concluído');
  await player.close();
});

test('documentação de funções é pesquisável e o guia abre um exemplo editável', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Guia de Portugol/ }).click();
  await page.getByLabel('Buscar na ajuda').fill('Navegador');
  await page.getByRole('button', { name: 'Navegador', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Biblioteca Navegador' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'eh_celular', exact: true })).toBeVisible();
  await expect(page.locator('.library-docs')).toContainText('Biblioteca exclusiva da versão Web');
  await page.getByLabel('Buscar na ajuda').fill('eh_celular');
  await page.getByRole('button', { name: 'Navegador.eh_celular', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Retorno · logico' })).toBeVisible();
  await expect(page.locator('.library-docs')).toContainText('Não recebe parâmetros.');
  await page.getByLabel('Buscar na ajuda').fill('Ambiente do navegador');
  await page.getByRole('button', { name: 'Ambiente do navegador', exact: true }).click();
  const article = page.frameLocator('.help-reader iframe');
  await expect(article.getByRole('heading', { name: 'Ambiente do navegador', exact: true })).toBeVisible();
  await expect(article.getByRole('heading', { name: '4. Limites da identificação' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await article.locator('body').evaluate(node => node.ownerDocument.documentElement.scrollWidth <= node.ownerDocument.defaultView.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/navigator-help-mobile.png' });
  await article.getByRole('button', { name: 'Abrir no editor' }).click();
  await expect(page.getByRole('tab', { name: /Conheça seu navegador/ })).toBeVisible();
  await expect(page.locator('.cm-content')).toContainText('inclua biblioteca Navegador --> nav');
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByLabel('Terminal de execução')).toContainText('MEU AMBIENTE DE EXECUÇÃO');
});

test('medidas acompanham a janela destacada e voltam à janela do editor', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await setEditorCode(page, `programa {
    inclua biblioteca Navegador --> nav inclua biblioteca Graficos --> g
    funcao inicio() {
      g.iniciar_modo_grafico(verdadeiro)
      enquanto (verdadeiro) {
        limpa()
        escreva(nav.largura_janela(), " x ", nav.altura_janela(), " ", nav.obter_orientacao())
        g.renderizar()
      }
    }
  }`);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByLabel('Terminal de execução')).toHaveText('1280 x 800 paisagem');
  const pending = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Abrir em nova aba ↗' }).click();
  const popup = await pending;
  await popup.setViewportSize({ width: 420, height: 700 });
  await expect(popup.getByLabel('Terminal de execução')).toHaveText('420 x 700 retrato');
  await popup.setViewportSize({ width: 700, height: 420 });
  await expect(popup.getByLabel('Terminal de execução')).toHaveText('700 x 420 paisagem');
  await popup.getByRole('button', { name: 'Trazer para o editor' }).click();
  await expect(page.getByLabel('Terminal de execução')).toHaveText('1280 x 800 paisagem');
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
});

test.describe('ambiente de celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' });
  test('identifica Android com toque e imprime a adaptação dos controles', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(navigator, 'userAgentData', { value: undefined }); });
    await openExample(page);
    await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
    const output = page.getByLabel('Terminal de execução');
    await expect(output).toContainText('Sistema operacional: Android');
    await expect(output).toContainText('Celular: verdadeiro');
    await expect(output).toContainText('Tablet: falso');
    await expect(output).toContainText('Suporta toque: verdadeiro');
    await expect(output).toContainText('Mouse ou apontador preciso: falso');
    await expect(output).toContainText('Este ambiente permite oferecer joystick e botões de toque.');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
