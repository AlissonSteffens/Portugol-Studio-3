import { test, expect } from './fixtures.js';

const view = async (page, item) => {
  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('button', { name: 'Exibir', exact: true }).click();
  await page.getByRole('menu', { name: 'Exibir' }).getByRole(/^Restaurar/.test(item) ? 'menuitem' : 'menuitemcheckbox', { name: item }).click();
};

test('lateral, ferramenta, saída e código são restaurados após recarregar', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/app/');
  await page.getByRole('button', { name: /Novo programa/ }).click();
  const source = 'programa { funcao inicio() { escreva("Restaurado") } }';
  await page.locator('.cm-content').fill(source);
  // Screens and editor tools live in different places: the left bar never holds the tools.
  await expect(page.getByRole('navigation', { name: 'Telas' }).getByRole('button')).toHaveCount(3);
  const tools = page.getByRole('group', { name: 'Ferramentas do programa' });
  await tools.getByRole('button', { name: 'Mostrar recursos', exact: true }).click();
  await expect(tools.getByRole('button', { name: 'Mostrar recursos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const sidebar = page.locator('.code-inspector');
  const initial = (await sidebar.boundingBox()).width;
  const handle = page.getByRole('separator', { name: 'Largura da lateral' });
  const rect = await handle.boundingBox();
  await page.mouse.move(rect.x + 2, rect.y + 30);
  await page.mouse.down(); await page.mouse.move(rect.x + 62, rect.y + 30); await page.mouse.up();
  expect((await sidebar.boundingBox()).width).toBeGreaterThan(initial + 45);
  await view(page, 'Terminal');
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
  // Hiding the panel keeps the chosen tool for when it comes back.
  await page.getByRole('button', { name: 'Painel do programa', exact: true }).click();
  await page.reload(); await expect(sidebar).toHaveCount(0);
  await page.getByRole('button', { name: 'Painel do programa', exact: true }).click();
  await expect(page.locator('.workspace-repository')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar painel', exact: true }).click();
  await expect(sidebar).toHaveCount(0);
  await view(page, 'Restaurar layout padrão');
  await expect(sidebar).toBeVisible(); await expect(page.locator('.workspace-output')).toBeHidden();
  await expect(page.locator('.workspace-repository')).toBeHidden();
  await expect(tools.getByRole('button', { name: 'Mostrar mensagens', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('dados locais inválidos não impedem abrir a aplicação', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('portugol-studio-documents-v1', '{invalid');
    localStorage.setItem('portugol-studio-output-ratio', '999');
    localStorage.setItem('portugol-studio-home', '"invalid"');
    localStorage.setItem('portugol-studio-side-panel-tab', '"nada"');
    localStorage.setItem('portugol-studio-side-panel-open', '"sim"');
  });
  await page.goto('/app/');
  await expect(page.getByRole('heading', { name: 'Explore os exemplos' })).toBeVisible();
});
