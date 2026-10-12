import { test, expect } from '@playwright/test';
test('esfera mantém a luz acima e à direita durante a rotação', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Buscar exemplos').fill('Esfera 3D');
  await page.locator('.welcome-example-list').getByRole('button', { name: /Esfera 3D/ }).click();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.locator('.ide-status')).toContainText('Executando');
  const brightness = () => page.locator('canvas').evaluate(canvas => {
    const context = canvas.getContext('2d');
    return [[470, 230], [330, 370]].map(([x, y]) => Array.from(context.getImageData(x, y, 1, 1).data));
  });
  await expect.poll(async () => { const [light, shadow] = await brightness(); return light[0] - shadow[0]; }).toBeGreaterThan(70);
  const [light, shadow] = await brightness();
  for (const pixel of [light, shadow]) { expect(Math.max(...pixel.slice(0, 3)) - Math.min(...pixel.slice(0, 3))).toBeLessThanOrEqual(3); expect(pixel[3]).toBe(255); }
  const frame = () => page.locator('canvas').evaluate(canvas => Array.from(canvas.getContext('2d').getImageData(350, 250, 100, 100).data).join(','));
  const beforeRotation = await frame();
  await page.locator('canvas').focus();
  await page.keyboard.down('d');
  await expect.poll(frame).not.toBe(beforeRotation);
  await expect.poll(async () => { const [light, shadow] = await brightness(); return light[0] - shadow[0]; }).toBeGreaterThan(70);
  await page.keyboard.up('d');
  await page.screenshot({ path: 'test-results/sphere-lighting.png' });
  await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
  await expect(page.locator('.ide-status')).toContainText('Interrompido');
});
