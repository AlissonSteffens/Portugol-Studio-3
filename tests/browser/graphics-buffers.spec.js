import { test, expect } from '@playwright/test';

test('buffers mantêm camadas, transparência e conteúdo após voltar à janela', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Mostrar editor', exact: true }).click();
  await page.locator('.cm-content').fill(`programa {
    inclua biblioteca Graficos --> g
    funcao inicio() {
      g.iniciar_modo_grafico()
      g.definir_dimensoes_janela(120, 100)
      inteiro fundo = g.criar_buffer(120, 100)
      inteiro frente = g.criar_buffer(120, 100)
      g.usar_buffer(fundo)
      g.definir_cor(g.criar_cor(0, 0, 255))
      g.limpar()
      g.usar_buffer(frente)
      g.definir_cor(g.criar_cor(255, 0, 0))
      g.desenhar_retangulo(0, 0, 30, 30, falso, verdadeiro)
      g.usar_buffer(0)
      g.desenhar_buffer(0, 0, fundo)
      g.desenhar_buffer(0, 0, frente)
      g.renderizar()
      g.limpar_buffer(frente)
      g.usar_buffer(frente)
      g.definir_cor(g.criar_cor(0, 255, 0))
      g.desenhar_retangulo(30, 30, 30, 30, falso, verdadeiro)
      g.usar_buffer(0)
      g.desenhar_buffer(0, 0, fundo)
      g.definir_opacidade(128)
      g.desenhar_buffer(0, 0, frente)
      g.definir_opacidade(255)
      g.renderizar()
      g.liberar_buffer(fundo)
      g.liberar_buffer(frente)
    }
  }`);
  await expect(page.locator('.diagnostic-row.error')).toHaveCount(0);
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  await expect(page.getByText('● Concluído')).toBeVisible();
  const pixels = await page.locator('canvas').evaluate(canvas => {
    const c = canvas.getContext('2d'); return [[10, 10], [40, 40], [80, 80]].map(([x, y]) => [...c.getImageData(x, y, 1, 1).data]);
  });
  expect(pixels[0]).toEqual([0, 0, 255, 255]);
  expect(pixels[2]).toEqual([0, 0, 255, 255]);
  expect(pixels[1][1]).toBeGreaterThan(120); expect(pixels[1][2]).toBeGreaterThan(120);
});
