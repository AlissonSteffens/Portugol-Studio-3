import { test, expect } from '@playwright/test';

const release = 'https://github.com/AlissonSteffens/Portugol-Studio-3/releases/latest/download/';
// Must match the artifact names in scripts/build-desktop.js.
const files = ['Portugol-Studio-windows-x64.exe', 'Portugol-Studio-windows-x64.zip', 'Portugol-Studio-macos-arm64.dmg', 'Portugol-Studio-macos-x64.dmg', 'Portugol-Studio-linux-x64.AppImage', 'Portugol-Studio-linux-x64.deb', 'Portugol-Studio-linux-x64.tar.gz'];

test('página inicial apresenta o Portugol Studio e abre a IDE', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Aprenda a programar em português.');
  await expect.poll(() => page.locator('.screenshot img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  const hrefs = await page.locator('a[href*="/releases/latest/download/"]').evaluateAll(links => links.map(link => link.href));
  expect([...new Set(hrefs)].sort()).toEqual(files.map(file => release + file).sort());
  await page.getByRole('link', { name: 'Usar no navegador' }).click();
  await expect(page).toHaveURL(/\/app\/$/);
  await expect(page.getByRole('button', { name: 'Mostrar editor', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('download principal acompanha o sistema do visitante', async ({ browser }) => {
  const systems = [
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36', 'Win32', 'Baixar para Windows', release + files[0], 'windows'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36', 'MacIntel', 'Baixar para macOS', '#versoes', 'macos'],
    ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36', 'Linux x86_64', 'Baixar para Linux', '#versoes', 'linux'],
  ];
  for (const [userAgent, platform, label, href, os] of systems) {
    const context = await browser.newContext({ userAgent });
    const page = await context.newPage();
    await page.addInitScript(value => { Object.defineProperty(Navigator.prototype, 'platform', { get: () => value }); Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined }); }, platform);
    await page.goto('/');
    const primary = page.locator('[data-download-primary]');
    await expect(primary).toHaveText(label);
    expect(await primary.getAttribute('href')).toBe(href);
    const card = page.locator('[data-download-card]');
    await expect(card).toHaveText(label);
    expect(await card.getAttribute('href')).toBe(href);
    await expect(page.locator('.platform').first()).toHaveAttribute('data-os', os);
    await expect(page.locator('.platform-current .badge')).toBeVisible();
    await context.close();
  }
});

test('no celular a página oferece só a versão para navegador', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-download-primary]')).toHaveCount(0);
  await expect(page.getByText('No celular, no tablet e no Chromebook, use a versão para navegador.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Usar no navegador' })).toBeVisible();
  await expect(page.locator('[data-download-card]')).toHaveText('Ver downloads');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
