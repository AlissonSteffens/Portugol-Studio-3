import { test, expect } from '@playwright/test';

test('divisórias, painéis, abas e código são restaurados após recarregar', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/');
  await page.getByRole('button', { name: /Novo programa/ }).click();
  const source = 'programa { funcao inicio() { escreva("Restaurado") } }';
  await page.locator('.cm-content').fill(source);
  const repository = page.locator('.workspace-repository');
  const initial = (await repository.boundingBox()).width;
  const handle = page.getByRole('separator', { name: 'Largura do repositório' });
  const rect = await handle.boundingBox();
  await page.mouse.move(rect.x + 3, rect.y + 30);
  await page.mouse.down();
  await page.mouse.move(rect.x + 63, rect.y + 30);
  await page.mouse.up();
  expect((await repository.boundingBox()).width).toBeGreaterThan(initial + 45);
  await page.getByRole('separator', { name: 'Tamanho dos painéis de execução' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('separator', { name: 'Divisão entre gráfico e terminal' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('portugol-studio-documents-v1'))?.documents.at(-1)?.code)).toBe(source);
  await page.getByRole('button', { name: 'Recolher gráfico', exact: true }).click();
  await expect(page.locator('.graphic-tool')).toBeHidden();
  await page.reload();
  await expect(page.locator('.cm-content')).toContainText('Restaurado');
  await expect(page.getByRole('tab', { name: /sem_titulo_1.por/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.graphic-tool')).toBeHidden();
  expect((await repository.boundingBox()).width).toBeGreaterThan(initial + 45);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('portugol-studio-output-ratio')))).toBeCloseTo(.47);
  await page.getByRole('button', { name: 'Recolher terminal', exact: true }).click();
  await expect(page.locator('.workspace-output')).toBeHidden();
  await page.reload();
  await expect(page.locator('.workspace-output')).toBeHidden();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByLabel('Terminal de execução')).toContainText('Restaurado');
  await page.getByRole('button', { name: 'Recolher repositório', exact: true }).click();
  await page.reload();
  await expect(page.locator('.workspace-repository')).toBeHidden();
  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('button', { name: 'Exibir', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Restaurar layout padrão' }).click();
  await expect(repository).toBeVisible();
  await expect(page.locator('.graphic-tool')).toBeVisible();
  await page.screenshot({ path: 'test-results/layout-wide.png' });
  await page.setViewportSize({ width: 1100, height: 800 });
  await expect(page.getByRole('separator', { name: 'Tamanho dos painéis de execução' })).toHaveAttribute('aria-orientation', 'horizontal');
  await page.screenshot({ path: 'test-results/layout-stacked.png' });
});

test('dados locais inválidos não impedem abrir a aplicação', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('portugol-studio-documents-v1', '{invalid');
    localStorage.setItem('portugol-studio-output-ratio', '999');
    localStorage.setItem('portugol-studio-home', '"invalid"');
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'O que vamos criar hoje?' })).toBeVisible();
});
