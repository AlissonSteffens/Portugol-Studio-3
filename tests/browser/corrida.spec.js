import { test, expect } from '@playwright/test';

for (const detached of [false, true]) test(`corrida anima pixels da pista e sprites com WASD ${detached ? 'em outra aba' : 'no painel'}`, async ({ page, context }) => {
  test.setTimeout(45000);
  await context.addInitScript(() => {
    // Keep traffic spacing/speeds deterministic without changing the example's logic.
    Math.random = () => 0;
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    const pending = new WeakMap();
    window.raceFrames = [];
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      const result = draw.apply(this, args);
      if (args[0] instanceof HTMLImageElement) {
        let frame = pending.get(this.canvas);
        if (!frame) pending.set(this.canvas, frame = { sprites: [] });
        if (args.length === 3) frame.roadY = args[2];
        if (args.length === 9) frame.sprites.push({ x: args[5], y: args[6], width: args[3], height: args[4] });
      } else if (this.canvas.getAttribute('aria-label') === 'Tela gráfica Portugol' && pending.has(args[0])) {
        const frame = pending.get(args[0]);
        const pixels = this.getImageData(185, 100, 25, 128).data;
        let hash = 0;
        for (let i = 0; i < pixels.length; i++) hash = (hash * 31 + pixels[i]) | 0;
        frame.roadPixels = hash;
        window.raceFrames.push(frame);
        if (window.raceFrames.length > 1200) window.raceFrames.shift();
        pending.delete(args[0]);
      }
      return result;
    };
  });
  await page.goto('/');
  await page.getByLabel('Buscar exemplos').fill('corrida');
  await page.getByRole('button', { name: /Corrida/ }).click();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  let game = page;
  if (detached) {
    const popup = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Abrir em nova aba ↗' }).click();
    game = await popup;
  }
  await expect(game.getByText('W / ↑ acelerar · A D / ← → virar · S / Espaço frear', { exact: true })).toBeVisible();
  await game.getByLabel('Tela gráfica Portugol').focus();
  await game.keyboard.down('w');
  // The runtime draws from the owner's window, but the drawing context belongs
  // to the original document where the canvas was created.
  const frames = () => page.evaluate(() => window.raceFrames);
  await expect.poll(async () => new Set((await frames()).map(f => f.roadY)).size, { timeout: 20000 }).toBeGreaterThan(20);
  expect(new Set((await frames()).map(f => f.roadPixels)).size).toBeGreaterThan(10);
  const playerX = async () => (await frames()).at(-1).sprites.find(s => s.y === 444)?.x;
  const initialX = await playerX();
  expect(initialX).toBeDefined();
  await game.keyboard.down('d');
  await expect.poll(playerX).toBeGreaterThan(initialX + 20);
  await game.keyboard.up('d');
  const rightX = await playerX();
  await game.keyboard.down('a');
  await expect.poll(playerX).toBeLessThan(rightX - 20);
  await game.keyboard.up('a');
  await expect.poll(async () => (await frames()).some(f => f.sprites.some(s => s.y > 60 && s.y < 400 && s.width >= 40 && s.height >= 85)), { timeout: 20000 }).toBe(true);
  await game.keyboard.up('w');
  await game.screenshot({ path: `test-results/corrida-animation-${detached ? 'popup' : 'panel'}.png` });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
  if (detached) await game.close();
});

test('corrida recebe foco, passa pela largada e responde a acelerar, virar e frear', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Buscar exemplos').fill('corrida');
  await page.getByRole('button', { name: /Corrida/ }).click();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  const canvas = page.getByLabel('Tela gráfica Portugol');
  await expect(canvas).toBeFocused();
  expect((await canvas.boundingBox()).height).toBeGreaterThan(200);
  await page.getByRole('button', { name: 'Árvore do código', exact: true }).click();
  await page.getByRole('button', { name: 'Expandir carro_jogador', exact: true }).click();
  const car = page.getByRole('treeitem', { name: 'carro_jogador', exact: true });
  const value = index => car.getByRole('treeitem', { name: `[${index}]`, exact: true }).locator('.symbol-value').textContent().then(Number);
  const distance = () => page.getByRole('treeitem', { name: 'distancia_percorrida', exact: true }).locator('.symbol-value').textContent().then(Number);
  await canvas.focus();
  await page.keyboard.down('ArrowUp');
  await expect.poll(distance, { timeout: 16000 }).toBeGreaterThan(100);
  await page.keyboard.up('ArrowUp');
  const before = [await value(0), await value(3)];
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => value(0)).toBeGreaterThan(before[0] + 10);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('Space');
  await expect.poll(() => value(3)).toBeLessThan(before[1] / 2);
  await page.keyboard.up('Space');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/corrida.png' });
  await page.keyboard.press('Escape');
  await expect(page.locator('.ide-status')).toContainText('Interrompido');
});
