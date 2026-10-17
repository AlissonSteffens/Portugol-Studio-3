import { test, expect } from '@playwright/test';
import { setEditorCode } from './helpers/editor.js';
import { pathToFileURL } from 'node:url';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function openDemo(page) {
  await page.goto('/');
  await page.getByLabel('Buscar exemplos').fill('Missão Órbita');
  await page.locator('.welcome-example-list').getByRole('button', { name: /Missão Órbita/ }).click();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Controles de toque' })).toBeVisible();
}
async function exitFullscreen(page) {
  const exit = page.getByRole('button', { name: 'Sair da tela cheia', exact: true });
  if (await exit.count()) await exit.click();
}
async function stopGame(page) {
  await exitFullscreen(page);
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
}
async function point(locator) {
  const box = await locator.boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function touch(session, type, points) {
  await session.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p, id) => ({ ...p, id, radiusX: 3, radiusY: 3 })) });
}
async function joystickPoint(page, direction = 'right') {
  const box = await page.getByRole('group', { name: 'Joystick direcional' }).boundingBox();
  const [x, y] = { right: [.8, .5], up: [.5, .2], down: [.5, .8], left: [.2, .5], diagonal: [.8, .2], center: [.5, .5] }[direction];
  return { x: box.x + box.width * x, y: box.y + box.height * y };
}

async function mouseStickPoint(page) {
  const box = await page.getByRole('group', { name: 'Joystick do mouse', exact: true }).boundingBox();
  return { x: box.x + box.width * .75, y: box.y + box.height * .75 };
}

async function renderedFrames(page, count = 6) {
  await page.evaluate(count => new Promise(resolve => {
    const next = () => --count ? requestAnimationFrame(next) : resolve();
    requestAnimationFrame(next);
  }), count);
}

for (const relative of [true, false]) test(`joystick direito mantém movimento XY ${relative ? 'relativo' : 'absoluto'}, simultâneo e cancela sem entrada presa`, async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await setEditorCode(page, `programa {
    inclua biblioteca Graficos --> g inclua biblioteca Teclado --> t inclua biblioteca Mouse --> m
    funcao inicio() {
      inteiro x = 0, y = 0
      ${relative ? '' : 'inteiro pixels[2000]'}
      g.iniciar_modo_grafico(verdadeiro) g.definir_dimensoes_janela(400, 400)
      g.entrar_modo_tela_cheia() g.entrar_modo_tela_cheia()
      ${relative ? 'm.capturar_cursor()' : ''}
      enquanto (verdadeiro) {
        ${relative ? 'x += m.movimento_x() y += m.movimento_y()' : 'pixels[m.posicao_x()] = m.posicao_y() x = m.posicao_x() y = pixels[m.posicao_x()]'}
        inteiro azul = 0
        se (t.tecla_pressionada(t.TECLA_SETA_DIREITA)) azul = 100
        se (m.botao_pressionado(m.BOTAO_ESQUERDO)) azul += 100
        g.definir_cor(g.criar_cor(x % 256, y % 256, azul)) g.limpar() g.renderizar()
      }
    }
  }`);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  const mouseStick = page.getByRole('group', { name: 'Joystick do mouse', exact: true });
  await expect(mouseStick).toBeVisible();
  const session = await context.newCDPSession(page);
  const color = () => page.locator('canvas').evaluate(c => Array.from(c.getContext('2d').getImageData(0, 0, 1, 1).data).slice(0, 3));
  await touch(session, 'touchStart', [await joystickPoint(page), await mouseStickPoint(page), await point(page.getByRole('button', { name: 'Clique', exact: true }))]);
  await expect.poll(color).toEqual([expect.any(Number), expect.any(Number), 200]);
  await expect.poll(async () => (await color())[0]).toBeGreaterThan(30);
  const moving = await color();
  // No pointermove: a held stick must keep producing deltas on subsequent frames.
  await expect.poll(async () => (await color())[0]).not.toBe(moving[0]);
  await touch(session, 'touchCancel', []);
  await expect(mouseStick).toHaveAttribute('data-active', 'false');
  await expect.poll(async () => (await color())[2]).toBe(0);
  await renderedFrames(page);
  const released = await color();
  await renderedFrames(page);
  expect(await color()).toEqual(released);
  expect(released[1]).toBeGreaterThan(0);
  await exitFullscreen(page);
  await expect.poll(() => page.locator('canvas').evaluate(c => [c.width, c.height])).toEqual([400, 400]);
  await page.getByRole('button', { name: 'Tela cheia', exact: true }).click();
  await expect(page.locator('.fullscreen-exit')).toHaveCount(1);
  await expect(page.locator('.touch-controls')).toHaveAttribute('data-fullscreen', 'true');
  await exitFullscreen(page);
  await page.locator('.mobile-tools').getByRole('button', { name: 'Editor', exact: true }).click();
  await expect(page.locator('.touch-controls')).toHaveCount(0);
  await page.locator('.mobile-tools').getByRole('button', { name: 'Execução', exact: true }).click();
  await expect.poll(color).toEqual(released);
  await stopGame(page);
});

for (const game of [
  { name: 'Pista Neon', stick: false },
  { name: 'Arena Pulsar', stick: true },
  { name: 'Corte Tropical', stick: true },
]) test(`${game.name} executa em tela cheia e adapta o campo ao girar o celular`, async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Buscar exemplos').fill(game.name);
  await page.locator('.welcome-example-list').getByRole('button', { name: new RegExp(game.name) }).click();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.locator('canvas')).toHaveAttribute('data-fullscreen', 'true');
  await expect(page.getByRole('group', { name: 'Joystick do mouse', exact: true })).toHaveCount(game.stick ? 1 : 0);
  await exitFullscreen(page);
  await page.getByRole('button', { name: 'Mostrar árvore', exact: true }).click();
  await page.locator('.mobile-tools').getByRole('button', { name: 'Execução', exact: true }).click();
  await page.getByRole('button', { name: 'Tela cheia', exact: true }).click();
  const value = name => page.getByRole('treeitem', { name, exact: true, includeHidden: true }).locator(':scope > .tree-row .symbol-value').textContent();
  const session = await page.context().newCDPSession(page);
  if (game.name === 'Pista Neon') {
    await touch(session, 'touchStart', [await joystickPoint(page)]);
    await expect.poll(() => value('pista')).toBe('2');
    await touch(session, 'touchEnd', []);
    await touch(session, 'touchStart', [await point(page.getByRole('button', { name: 'Tecla Espaço', exact: true }))]);
    await expect.poll(async () => Number(await value('salto'))).toBeGreaterThan(0);
    await touch(session, 'touchEnd', []);
  } else if (game.name === 'Arena Pulsar') {
    await touch(session, 'touchStart', [await joystickPoint(page), await mouseStickPoint(page), await point(page.getByRole('button', { name: 'Clique', exact: true }))]);
    await expect.poll(async () => Number(await value('jogador_x'))).toBeGreaterThan(.55);
    await expect.poll(async () => Number(await value('mira_x'))).toBeGreaterThan(.55);
    await expect.poll(async () => Number(await value('proximo'))).toBeGreaterThan(0);
    await touch(session, 'touchEnd', []);
  } else {
    // Find a rendered fruit, then cut it with actual touch input. Bombs are skipped.
    let fruit;
    await expect.poll(async () => {
      fruit = await page.locator('canvas').evaluate(c => {
        const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
        for (let y = 130; y < c.height - 230; y++) for (let x = 30; x < c.width - 30; x++) {
          const i = (y * c.width + x) * 4;
          if ((data[i] === 255 && ((data[i + 1] === 113 && data[i + 2] === 126) || (data[i + 1] === 183 && data[i + 2] === 77))) || (data[i] === 136 && data[i + 1] === 217 && data[i + 2] === 113)) return { x, y };
        }
        return null;
      });
      return !!fruit;
    }).toBe(true);
    await touch(session, 'touchStart', [fruit]);
    await expect.poll(async () => Number(await value('pontos'))).toBeGreaterThan(0);
    await touch(session, 'touchEnd', []);
  }
  for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(size);
    await expect.poll(() => page.locator('canvas').evaluate(c => [c.width, c.height])).toEqual([size.width, size.height]);
    await renderedFrames(page);
    for (const control of await page.locator('.touch-controls button, .touch-controls [role=group]').all()) await expect(control).toBeInViewport();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.screenshot({ path: `test-results/${game.name.split(' ')[0]}-${size.width}x${size.height}.png` });
  }
  await stopGame(page);
  await expect(page.locator('.fullscreen-exit, .touch-controls')).toHaveCount(0);
});

test('jogo para celular cabe em retrato e paisagem, com botões de tamanho confortável', async ({ page }) => {
  await openDemo(page);
  for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(size);
    const canvas = await page.locator('canvas').boundingBox();
    expect(canvas.width).toBe(size.width);
    expect(canvas.height).toBe(size.height);
    await expect.poll(() => page.locator('canvas').evaluate(c => [c.width, c.height])).toEqual([size.width, size.height]);
    expect(canvas.x).toBeGreaterThanOrEqual(0);
    expect(canvas.y + canvas.height).toBe(size.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('group', { name: 'Joystick direcional' })).toBeInViewport();
    for (const button of await page.locator('.touch-controls button').all()) {
      await expect(button).toBeInViewport();
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: `test-results/mobile-${size.width}x${size.height}.png` });
  }
  await expect(page.getByRole('alert')).toHaveCount(0);
  await stopGame(page);
  await expect(page.locator('.touch-controls')).toHaveCount(0);
});

test('multitoque pressiona direção e ação, solta ao cancelar e traduz coordenadas do canvas', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await setEditorCode(page, `programa {
    inclua biblioteca Graficos --> g
    inclua biblioteca Teclado --> t
    inclua biblioteca Mouse --> m
    funcao inicio() {
      g.iniciar_modo_grafico(verdadeiro)
      g.definir_dimensoes_janela(400, 400)
      enquanto (verdadeiro) {
        inteiro vermelho = 0, verde = 0, azul = 0
        se (t.tecla_pressionada(t.TECLA_SETA_DIREITA)) vermelho = 255
        se (t.tecla_pressionada(t.TECLA_ESPACO)) verde = 255
        se (t.tecla_pressionada(t.TECLA_SETA_ACIMA)) azul = 128
        se (m.botao_pressionado(m.BOTAO_ESQUERDO)) azul = 255
        g.definir_cor(g.criar_cor(vermelho, verde, azul))
        g.limpar()
        se (m.botao_pressionado(m.BOTAO_ESQUERDO)) {
          g.definir_cor(g.COR_BRANCO)
          g.desenhar_retangulo(m.posicao_x(), m.posicao_y(), 10, 10, falso, verdadeiro)
        }
        g.renderizar()
      }
    }
  }`);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  const direction = page.getByRole('group', { name: 'Joystick direcional' }), action = page.getByRole('button', { name: 'Tecla Espaço', exact: true });
  await expect(direction).toBeVisible();
  const session = await context.newCDPSession(page);
  const color = () => page.locator('canvas').evaluate(c => Array.from(c.getContext('2d').getImageData(0, 0, 1, 1).data).slice(0, 3));
  await touch(session, 'touchStart', [await joystickPoint(page), await point(action)]);
  await expect.poll(color).toEqual([255, 255, 0]);
  await touch(session, 'touchMove', [await joystickPoint(page, 'diagonal'), await point(action)]);
  await expect.poll(color).toEqual([255, 255, 128]);
  await touch(session, 'touchMove', [await joystickPoint(page, 'up'), await point(action)]);
  await expect.poll(color).toEqual([0, 255, 128]);
  await touch(session, 'touchMove', [await joystickPoint(page, 'center'), await point(action)]);
  await expect.poll(color).toEqual([0, 255, 0]);
  await touch(session, 'touchCancel', []);
  await expect.poll(color).toEqual([0, 0, 0]);
  const canvas = page.locator('canvas'), center = await point(canvas);
  await touch(session, 'touchStart', [center]);
  await expect.poll(color).toEqual([0, 0, 255]);
  await expect.poll(() => canvas.evaluate(c => Array.from(c.getContext('2d').getImageData(202, 202, 1, 1).data).slice(0, 3))).toEqual([255, 255, 255]);
  await touch(session, 'touchEnd', []);
  await expect.poll(color).toEqual([0, 0, 0]);
  await touch(session, 'touchStart', [await joystickPoint(page)]);
  await expect.poll(color).toEqual([255, 0, 0]);
  await page.locator('.mobile-tools').getByRole('button', { name: 'Editor', exact: true }).click();
  await touch(session, 'touchEnd', []);
  await page.locator('.mobile-tools').getByRole('button', { name: 'Execução', exact: true }).click();
  await expect.poll(color).toEqual([0, 0, 0]);
  await stopGame(page);
});

test('controles continuam funcionando na aba de execução e ao restaurar', async ({ page, context }) => {
  await openDemo(page);
  await exitFullscreen(page);
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Abrir em nova aba ↗' }).click();
  const game = await popup;
  const up = game.getByRole('group', { name: 'Joystick direcional' });
  await expect(up).toBeVisible();
  const session = await context.newCDPSession(game);
  await touch(session, 'touchStart', [await joystickPoint(game, 'up')]);
  await expect(up).toHaveAttribute('data-directions', 'up');
  await touch(session, 'touchEnd', []);
  await expect(up).toHaveAttribute('data-active', 'false');
  await game.getByRole('button', { name: 'Tela cheia', exact: true }).click();
  await expect(game.locator('canvas')).toHaveAttribute('data-fullscreen', 'true');
  await expect(game.locator('.touch-controls')).toHaveAttribute('data-fullscreen', 'true');
  await exitFullscreen(game);
  await game.getByRole('button', { name: 'Trazer para o editor' }).click();
  await expect(page.getByRole('group', { name: 'Joystick direcional' })).toBeVisible();
  await stopGame(page);
});

test('joystick também pilota jogos com WASD sem criar botões duplicados', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await setEditorCode(page, `programa {
    inclua biblioteca Graficos --> g inclua biblioteca Teclado --> t
    funcao inicio() {
      g.iniciar_modo_grafico(verdadeiro)
      enquanto (verdadeiro) {
        inteiro r = 0, v = 0, a = 0
        se (t.tecla_pressionada(t.TECLA_W)) r = 255
        se (t.tecla_pressionada(t.TECLA_A)) v = 128
        se (t.tecla_pressionada(t.TECLA_S)) a = 128
        se (t.tecla_pressionada(t.TECLA_D)) v = 255
        g.definir_cor(g.criar_cor(r, v, a)) g.limpar() g.renderizar()
      }
    }
  }`);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Joystick direcional' })).toBeVisible();
  await expect(page.locator('.touch-actions button')).toHaveCount(0);
  const session = await context.newCDPSession(page);
  const color = () => page.locator('canvas').evaluate(c => Array.from(c.getContext('2d').getImageData(0, 0, 1, 1).data).slice(0, 3));
  await touch(session, 'touchStart', [await joystickPoint(page, 'diagonal')]);
  await expect.poll(color).toEqual([255, 255, 0]);
  await touch(session, 'touchMove', [await joystickPoint(page, 'left')]);
  await expect.poll(color).toEqual([0, 128, 0]);
  await touch(session, 'touchMove', [await joystickPoint(page, 'down')]);
  await expect.poll(color).toEqual([0, 0, 128]);
  await touch(session, 'touchEnd', []);
  await expect.poll(color).toEqual([0, 0, 0]);
  await stopGame(page);
});

test('Missão Órbita responde ao direcional com turbo e ao sinalizador de toque', async ({ page, context }) => {
  await openDemo(page);
  await exitFullscreen(page);
  await page.getByRole('button', { name: 'Mostrar árvore', exact: true }).click();
  await page.locator('.mobile-tools').getByRole('button', { name: 'Execução', exact: true }).click();
  const value = name => page.getByRole('treeitem', { name, exact: true, includeHidden: true }).locator(':scope > .tree-row .symbol-value').textContent();
  const session = await context.newCDPSession(page);
  await touch(session, 'touchStart', [
    await joystickPoint(page),
    await point(page.getByRole('button', { name: 'Tecla Espaço', exact: true })),
  ]);
  await expect.poll(() => value('usou_setas')).toBe('verdadeiro');
  await expect.poll(() => value('usou_turbo')).toBe('verdadeiro');
  await expect.poll(async () => Number(await value('nave_x'))).toBeGreaterThan(280);
  await expect.poll(async () => Number(await value('energia'))).toBeLessThan(100);
  await expect.poll(() => value('frente_x')).toBe('1');
  await expect.poll(() => value('frente_y')).toBe('0');
  await touch(session, 'touchEnd', []);
  const initialX = Number(await value('nave_x')), box = await page.locator('canvas').boundingBox();
  await touch(session, 'touchStart', [{ x: box.x + 60 * box.width / 480, y: box.y + 460 * box.height / 600 }]);
  await expect.poll(() => value('usou_toque')).toBe('verdadeiro');
  await expect.poll(async () => Number(await value('nave_x'))).toBeLessThan(initialX - 20);
  await touch(session, 'touchEnd', []);
  await stopGame(page);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('exemplo de mouse não recebe direcional e programas sem entrada não recebem controles', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await setEditorCode(page, `programa {
    inclua biblioteca Graficos --> g inclua biblioteca Mouse --> m
    funcao inicio() { g.iniciar_modo_grafico(verdadeiro) enquanto (verdadeiro) { g.definir_cor(m.posicao_x()) g.limpar() g.renderizar() } }
  }`);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Clique', exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Joystick direcional', exact: true })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Joystick do mouse', exact: true })).toBeVisible();
  await stopGame(page);
  await page.locator('.mobile-tools').getByRole('button', { name: 'Editor', exact: true }).click();
  await setEditorCode(page, 'programa { funcao inicio() { escreva("Pronto") } }');
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.locator('.ide-status')).toContainText('Concluído');
  await expect(page.locator('.touch-controls')).toHaveCount(0);
});

test('arraste substitui mouse capturado e Enter virtual libera ler_tecla', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await setEditorCode(page, `programa {
    inclua biblioteca Graficos --> g inclua biblioteca Mouse --> m
    funcao inicio() {
      inteiro deslocamento = 0
      g.iniciar_modo_grafico(verdadeiro) g.definir_dimensoes_janela(400, 400) m.capturar_cursor()
      enquanto (verdadeiro) {
        deslocamento += m.movimento_x()
        inteiro vermelho = 0, verde = 0
        se (deslocamento > 0) vermelho = 255
        se (m.cursor_capturado()) verde = 255
        g.definir_cor(g.criar_cor(vermelho, verde, 0)) g.limpar() g.renderizar()
      }
    }
  }`);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.locator('.touch-controls')).toBeVisible();
  const session = await context.newCDPSession(page), center = await point(page.locator('canvas'));
  const color = () => page.locator('canvas').evaluate(c => Array.from(c.getContext('2d').getImageData(0, 0, 1, 1).data).slice(0, 3));
  await touch(session, 'touchStart', [center]);
  await expect.poll(color).toEqual([0, 255, 0]);
  await touch(session, 'touchMove', [{ x: center.x + 20, y: center.y }]);
  await expect.poll(color).toEqual([255, 255, 0]);
  await touch(session, 'touchEnd', []);
  await stopGame(page);
  await page.locator('.mobile-tools').getByRole('button', { name: 'Editor', exact: true }).click();
  await setEditorCode(page, `programa { inclua biblioteca Graficos --> g inclua biblioteca Teclado --> t
    funcao inicio() { g.iniciar_modo_grafico(verdadeiro) inteiro tecla = t.ler_tecla() escreva(tecla) }
  }`);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await page.getByRole('button', { name: 'Tecla Enter', exact: true }).tap();
  await expect(page.locator('.ide-status')).toContainText('Concluído');
  await expect(page.getByLabel('Terminal de execução')).toHaveText('10');
});

test('HTML exportado inclui os mesmos controles e pode jogar sem o editor', async ({ page, context }) => {
  await page.addInitScript(() => { window.showSaveFilePicker = undefined; });
  await openDemo(page);
  await stopGame(page);
  await page.getByRole('button', { name: 'Exportar projeto', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('dialog', { name: 'Exportar projeto' }).getByRole('button', { name: 'Exportar projeto', exact: true }).click();
  const download = await pending;
  const exportedPath = test.info().outputPath('mobile-export.html');
  await download.saveAs(exportedPath);
  const exported = await context.newPage();
  await exported.goto(pathToFileURL(exportedPath).href);
  await exported.getByRole('button', { name: 'Executar', exact: true }).click();
  const right = exported.getByRole('group', { name: 'Joystick direcional' });
  await expect(right).toBeVisible();
  await expect(right).toBeInViewport();
  expect(await exported.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const session = await context.newCDPSession(exported);
  await right.scrollIntoViewIfNeeded();
  await touch(session, 'touchStart', [await joystickPoint(exported)]);
  await expect(right).toHaveAttribute('data-directions', 'right');
  await touch(session, 'touchEnd', []);
  await expect(right).toHaveAttribute('data-active', 'false');
  await expect(exported.locator('canvas')).toHaveAttribute('data-fullscreen', 'true');
  await exitFullscreen(exported);
  await exported.getByRole('button', { name: 'Parar', exact: true }).click();
  await expect(exported.locator('#status')).toHaveText('Interrompido');
  await expect(exported.locator('.touch-controls')).toHaveCount(0);
  await exported.close();
});
