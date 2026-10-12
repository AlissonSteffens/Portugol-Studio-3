import { test, expect } from '@playwright/test';

test('cores inteiras preservam RGB e trocar de documento limpa o gráfico anterior', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await page.locator('.cm-content').fill(`programa {
    inclua biblioteca Graficos --> g
    funcao inicio() {
      g.iniciar_modo_grafico()
      g.definir_dimensoes_janela(120, 80)
      g.definir_titulo_janela("Cores do primeiro programa")
      g.definir_cor(g.COR_PRETO)
      g.limpar()
      g.definir_cor(301989887)
      g.desenhar_retangulo(0, 0, 40, 80, falso, verdadeiro)
      g.definir_cor(-4046236)
      g.desenhar_retangulo(40, 0, 40, 80, falso, verdadeiro)
      g.renderizar()
    }
  }`);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByText('● Concluído')).toBeVisible();
  const pixels = await page.locator('canvas').evaluate(canvas => {
    const c = canvas.getContext('2d');
    return [10, 50].map(x => [...c.getImageData(x, 10, 1, 1).data]);
  });
  expect(pixels[0]).toEqual([255, 255, 255, 255]);
  const rgb = -4046236;
  expect(pixels[1]).toEqual([(rgb >>> 16) & 255, (rgb >>> 8) & 255, rgb & 255, 255]);
  await page.getByRole('tab', { name: 'Início', exact: true }).click();
  await page.getByRole('button', { name: /Novo programa/ }).click();
  await expect(page.getByText('● Pronto')).toBeVisible();
  const canvas = page.locator('canvas');
  expect(await canvas.evaluate(node => [...node.getContext('2d').getImageData(10, 10, 1, 1).data])).toEqual([0, 0, 0, 0]);
  await expect(page.locator('.workspace-output')).toHaveAttribute('data-view', 'closed');
  await expect(page.getByText('Cores do primeiro programa', { exact: true })).toHaveCount(0);
});
