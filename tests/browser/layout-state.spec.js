import { test, expect } from '@playwright/test';

test('lateral, abas, saída e código são restaurados após recarregar', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/');
  await page.getByRole('button', { name: /Novo programa/ }).click();
  const source = 'programa { funcao inicio() { escreva("Restaurado") } }';
  await page.locator('.cm-content').fill(source);
  await page.getByRole('button', { name: 'Mostrar recursos', exact: true }).click();
  const sidebar = page.locator('.code-inspector');
  const initial = (await sidebar.boundingBox()).width;
  const handle = page.getByRole('separator', { name: 'Largura da lateral' });
  const rect = await handle.boundingBox();
  await page.mouse.move(rect.x + 2, rect.y + 30);
  await page.mouse.down(); await page.mouse.move(rect.x - 58, rect.y + 30); await page.mouse.up();
  expect((await sidebar.boundingBox()).width).toBeGreaterThan(initial + 45);
  await page.getByRole('button', { name: 'Mostrar terminal', exact: true }).click();
  await page.getByRole('separator', { name: 'Tamanho dos painéis de execução' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('portugol-studio-documents-v1'))?.documents.at(-1)?.code)).toBe(source);
  await page.reload();
  await expect(page.locator('.cm-content')).toContainText('Restaurado');
  await expect(page.getByRole('tab', { name: /sem_titulo_1.por/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.workspace-repository')).toBeVisible();
  await expect(page.locator('.workspace-output')).toBeVisible();
  expect((await sidebar.boundingBox()).width).toBeGreaterThan(initial + 45);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('portugol-studio-output-ratio')))).toBeCloseTo(.35);
  await page.getByRole('button', { name: 'Recolher terminal', exact: true }).click();
  await page.reload();
  await expect(page.locator('.workspace-output')).toBeHidden();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByLabel('Terminal de execução')).toContainText('Restaurado');
  await page.getByRole('button', { name: 'Recolher lateral', exact: true }).click();
  await page.reload(); await expect(sidebar).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('button', { name: 'Exibir', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Restaurar layout padrão' }).click();
  await expect(sidebar).toBeVisible(); await expect(page.locator('.workspace-output')).toBeHidden();
  await expect(page.locator('.workspace-repository')).toBeHidden();
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.getByRole('button', { name: 'Mostrar terminal', exact: true }).click();
  await expect(page.getByRole('separator', { name: 'Tamanho dos painéis de execução' })).toHaveAttribute('aria-orientation', 'horizontal');
});

test('dados locais inválidos não impedem abrir a aplicação', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('portugol-studio-documents-v1', '{invalid');
    localStorage.setItem('portugol-studio-output-ratio', '999');
    localStorage.setItem('portugol-studio-home', '"invalid"');
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Explore os exemplos' })).toBeVisible();
});
