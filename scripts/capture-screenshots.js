// Regenerates the IDE screenshots shown on the home page (public/site/*.webp).
// Run `npm run build` first; the script serves dist/ itself on a free port.
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const port = 4185;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
const browser = await chromium.launch();

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('O servidor não respondeu em ' + base);
}

/** Encodes a PNG screenshot as WebP with Chromium's encoder, so no image tool is needed. */
async function save(page, png, file) {
  const encoder = await browser.newPage();
  const data = await encoder.evaluate(async source => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + source;
    await image.decode();
    const canvas = Object.assign(document.createElement('canvas'), { width: image.width, height: image.height });
    canvas.getContext('2d').drawImage(image, 0, 0);
    return canvas.toDataURL('image/webp', 0.86).split(',')[1];
  }, png.toString('base64'));
  await encoder.close();
  await writeFile(`public/site/${file}`, Buffer.from(data, 'base64'));
  console.log('public/site/' + file);
}

async function newPage(viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport });
  // Keep the game docked next to the code instead of opening it in another tab.
  await context.addInitScript(() => localStorage.setItem('portugol-studio-graphics-target', '"painel"'));
  const page = await context.newPage();
  await page.goto(base + '/app/');
  return page;
}

try {
  await waitForServer();

  // Hero: a game running beside its code, with live values in the structure panel.
  let page = await newPage();
  await page.getByLabel('Buscar exemplos').fill('moon');
  await page.getByRole('button', { name: /Moon Lander/i }).first().click();
  await page.getByText('Estrutura', { exact: true }).click();
  await page.getByRole('button', { name: 'Executar programa', exact: true }).click();
  const canvas = page.getByLabel('Tela gráfica Portugol');
  await canvas.waitFor();
  await page.waitForTimeout(2000);
  await canvas.click();
  // The game polls the keyboard, so keys are held for a few frames.
  await page.keyboard.down('Enter'); await page.waitForTimeout(300); await page.keyboard.up('Enter');
  await page.waitForTimeout(1200);
  await page.keyboard.down('w'); await page.waitForTimeout(900); await page.keyboard.up('w');
  await page.evaluate(() => {
    const scroller = document.querySelector('.cm-scroller');
    scroller.scrollTop = 720 * document.querySelector('.cm-line').getBoundingClientRect().height - 4;
  });
  await page.waitForTimeout(300);
  await save(page, await page.screenshot(), 'ide.webp');
  await page.context().close();

  // Examples library on the start screen, smaller so it stays legible in the page.
  page = await newPage({ width: 1280, height: 760 });
  await page.getByRole('button', { name: /^Jogos/ }).first().click();
  await page.waitForTimeout(1200);
  await save(page, await page.screenshot(), 'exemplos.webp');
  await page.context().close();
} finally {
  await browser.close();
  server.kill();
}
