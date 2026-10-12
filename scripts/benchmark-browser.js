import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const results = [];
try {
  await page.addInitScript(() => {
    window.benchmarkFrames = [];
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      if (this.canvas.getAttribute('aria-label') === 'Tela gráfica Portugol') window.benchmarkFrames.push(performance.now());
      return draw.apply(this, args);
    };
  });
  for (const dimension of ['2D', '3D']) {
    await page.goto(process.env.PORTUGOL_URL || 'http://127.0.0.1:3000');
    await page.getByRole('button', { name: 'Tela inicial', exact: true }).click();
    await page.getByLabel('Buscar exemplos').fill(`Mundo de blocos ${dimension}`);
    await page.locator('.welcome-example-list').getByRole('button', { name: new RegExp(`Mundo de blocos ${dimension}`) }).click();
    await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
    await page.waitForFunction(() => window.benchmarkFrames.length > 1);
    for (const mode of dimension === '3D' ? ['parado', 'movendo'] : ['parado']) {
      if (mode === 'movendo') { await page.locator('canvas').focus(); await page.keyboard.down('w'); }
      const measurement = await page.evaluate(() => new Promise(resolve => {
        window.benchmarkFrames = []; const started = performance.now();
        setTimeout(() => {
          const duration = performance.now() - started, times = window.benchmarkFrames;
          const intervals = times.slice(1).map((time, i) => time - times[i]).sort((a, b) => a - b);
          resolve({ frames: times.length, durationMs: Math.round(duration), fps: Math.round(times.length * 10000 / duration) / 10, p95FrameMs: Math.round(intervals[Math.floor(intervals.length * .95)] || 0) });
        }, 1500);
      }));
      if (mode === 'movendo') await page.keyboard.up('w');
      results.push({ example: dimension, mode, ...measurement });
    }
    await page.getByRole('button', { name: 'Parar execução', exact: true }).click();
  }
} finally { await browser.close(); }
const output = JSON.stringify(results, null, 2); console.log(output);
if (process.argv[2]) await writeFile(process.argv[2], output + '\n');
