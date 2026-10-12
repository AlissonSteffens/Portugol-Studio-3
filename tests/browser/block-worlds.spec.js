import { writeFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

async function openWorld(page, dimension) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByLabel('Buscar exemplos').fill(`Mundo de blocos ${dimension}`);
  await page.locator('.welcome-example-list').getByRole('button', { name: new RegExp(`Mundo de blocos ${dimension}`) }).click();
  await expect(page.locator('.diagnostic-row')).toHaveCount(0);
  await page.getByRole('button', { name: 'Árvore do código', exact: true }).click();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByText('● Executando')).toBeVisible();
  return page.locator('canvas');
}
const value = (page, name) => page.getByRole('treeitem', { name, exact: true }).locator(':scope > .tree-row .symbol-value');

async function point(page, canvas, x, y) {
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + x * box.width / 900, box.y + y * box.height / 620);
}

test('mundo 2D permite retirar, trocar material, colocar e reiniciar', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const canvas = await openWorld(page, '2D');
  const color = () => canvas.evaluate(c => Array.from(c.getContext('2d').getImageData(380, 408, 1, 1).data).slice(0, 3));
  await expect.poll(color).toEqual([137, 89, 57]);
  await canvas.screenshot({ path: 'test-results/blocos-2d.png' });
  await writeFile('test-results/blocos-2d-full.png', Buffer.from(await canvas.evaluate(c => c.toDataURL('image/png').split(',')[1]), 'base64'));
  await point(page, canvas, 380, 408); await page.mouse.down();
  await expect(value(page, 'retirados')).toHaveText('1'); await page.mouse.up();
  await expect.poll(color).not.toEqual([137, 89, 57]);
  await canvas.focus(); await page.keyboard.down('2');
  await expect(value(page, 'escolhido')).toHaveText('2'); await page.keyboard.up('2');
  await point(page, canvas, 380, 408); await page.mouse.down({ button: 'right' });
  await expect(value(page, 'colocados')).toHaveText('1'); await page.mouse.up({ button: 'right' });
  await expect.poll(color).toEqual([107, 122, 143]);
  await canvas.focus(); await page.keyboard.down('r');
  await expect(value(page, 'retirados')).toHaveText('0'); await page.keyboard.up('r');
  await expect(value(page, 'colocados')).toHaveText('0');
  await expect.poll(color).toEqual([137, 89, 57]);
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
  await expect(page.getByText('● Interrompido')).toBeVisible();
  expect(errors).toEqual([]);
});

test('mundo 3D projeta cubos, retira e coloca na mira, move e gira a câmera', async ({ page }) => {
  test.setTimeout(60_000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const canvas = await openWorld(page, '3D');
  await expect(value(page, 'alvo_x')).not.toHaveText('-1');
  await expect.poll(() => canvas.evaluate(c => c.getContext('2d').getImageData(450, 400, 1, 1).data[1])).not.toBe(0);
  await canvas.screenshot({ path: 'test-results/blocos-3d.png' });
  await writeFile('test-results/blocos-3d-full.png', Buffer.from(await canvas.evaluate(c => c.toDataURL('image/png').split(',')[1]), 'base64'));
  await point(page, canvas, 450, 310); await page.mouse.down(); await page.mouse.up();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.tagName)).toBe('CANVAS');
  await expect(value(page, 'mouse_preso')).toHaveText('verdadeiro');
  await canvas.dispatchEvent('mousedown', { button: 0 });
  await expect(value(page, 'retirados')).toHaveText('1'); await canvas.dispatchEvent('mouseup', { button: 0 });
  await canvas.focus(); await page.keyboard.down('3');
  await expect(value(page, 'escolhido')).toHaveText('3'); await page.keyboard.up('3');
  await canvas.dispatchEvent('mousedown', { button: 2 });
  await expect(value(page, 'colocados')).toHaveText('1'); await canvas.dispatchEvent('mouseup', { button: 2 });
  const before = await value(page, 'camera_z').innerText();
  await canvas.focus(); await page.keyboard.down('w');
  await expect(value(page, 'camera_z')).not.toHaveText(before); await page.keyboard.up('w');
  await page.keyboard.down('ArrowRight');
  await expect(value(page, 'direcao')).not.toHaveText('0'); await page.keyboard.up('ArrowRight');
  await page.evaluate(() => document.exitPointerLock());
  await expect.poll(() => page.evaluate(() => document.pointerLockElement === null)).toBe(true);
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
  await expect(page.getByText('● Interrompido')).toBeVisible();
  expect(errors).toEqual([]);
});

test('personagem 2D pula, cai, colide e não constrói sobre si mesmo', async ({ page }) => {
  const canvas = await openWorld(page, '2D');
  await expect(value(page, 'no_chao')).toHaveText('verdadeiro');
  const initialY = Number(await value(page, 'jogador_y').innerText());
  await canvas.focus(); await page.keyboard.down('Space');
  await expect.poll(async () => Number(await value(page, 'jogador_y').innerText())).toBeLessThan(initialY - 15);
  await page.keyboard.up('Space');
  await expect(value(page, 'no_chao')).toHaveText('verdadeiro');
  await expect.poll(async () => Number(await value(page, 'jogador_y').innerText())).toBeGreaterThan(initialY - 3);
  // This empty cell contains the standing character.
  await point(page, canvas, 324, 352); await page.mouse.down({ button: 'right' });
  await expect.poll(() => canvas.evaluate(c => c.getContext('2d').getImageData(310, 338, 1, 1).data[1])).toBeGreaterThan(210);
  await expect(value(page, 'colocados')).toHaveText('0'); await page.mouse.up({ button: 'right' });
  await canvas.focus(); await page.keyboard.down('d');
  await expect.poll(async () => Number(await value(page, 'jogador_x').innerText())).toBeGreaterThan(345);
  await page.keyboard.up('d');
  expect(Number(await value(page, 'jogador_x').innerText())).toBeLessThanOrEqual(348);
  await expect(value(page, 'no_chao')).toHaveText('verdadeiro');
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
});

test('mouse gira a câmera, picareta anima e Esc solta o cursor sem parar o jogo', async ({ page }) => {
  const canvas = await openWorld(page, '3D');
  await expect(value(page, 'alvo_x')).not.toHaveText('-1');
  await point(page, canvas, 450, 310); await page.mouse.down(); await page.mouse.up();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.tagName)).toBe('CANVAS');
  await expect(value(page, 'retirados')).toHaveText('0'); // Activation is not mining.
  await expect(value(page, 'mouse_preso')).toHaveText('verdadeiro');
  const toolPixels = () => canvas.evaluate(c => [...c.getContext('2d').getImageData(720, 350, 120, 180).data].join(','));
  const resting = await toolPixels();
  await canvas.dispatchEvent('mousedown', { button: 0 });
  await expect(value(page, 'retirados')).toHaveText('1');
  await expect.poll(toolPixels, { intervals: [20, 50] }).not.toBe(resting); await canvas.dispatchEvent('mouseup', { button: 0 });
  await expect(value(page, 'animacao_picareta')).toHaveText('0');
  // Explicit relative deltas avoid OS-dependent pointer-lock warping in headless Chromium.
  await canvas.dispatchEvent('mousemove', { movementX: 35, movementY: 12, bubbles: true });
  await expect(value(page, 'direcao')).not.toHaveText('0');
  await expect(value(page, 'inclinacao')).not.toHaveText('-0.4');
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => document.pointerLockElement === null)).toBe(true);
  await expect(page.getByText('● Executando')).toBeVisible();
  await expect(value(page, 'mouse_preso')).toHaveText('falso');
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
  await expect(page.getByText('● Interrompido')).toBeVisible();
});

test('controle do mouse também funciona na aba gráfica destacada', async ({ page }) => {
  await openWorld(page, '3D');
  const promise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Abrir em nova aba' }).click();
  const popup = await promise, canvas = popup.locator('canvas');
  await popup.bringToFront();
  await expect(canvas).toBeVisible();
  await point(popup, canvas, 450, 310); await popup.mouse.down(); await popup.mouse.up();
  await expect.poll(() => popup.evaluate(() => document.pointerLockElement?.tagName)).toBe('CANVAS');
  const frame = () => canvas.evaluate(c => [...c.getContext('2d').getImageData(100, 100, 200, 200).data].join(','));
  const before = await frame();
  await canvas.dispatchEvent('mousemove', { movementX: 100, movementY: 0, bubbles: true });
  await expect.poll(frame).not.toBe(before);
  await popup.keyboard.press('Escape');
  await expect.poll(() => popup.evaluate(() => document.pointerLockElement === null)).toBe(true);
  await popup.getByRole('button', { name: 'Trazer para o editor' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByText('● Executando')).toBeVisible();
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
});
