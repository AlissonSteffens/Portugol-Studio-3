import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { START_URL, resolveAppPath, isAppUrl, isExternalUrl } = require('../desktop/protocol.cjs');
const root = path.resolve('dist');

test('desktop protocol serves files from the build', () => {
  assert.equal(resolveAppPath(root, START_URL), path.join(root, 'app', 'index.html'));
  assert.equal(resolveAppPath(root, 'app://portugol/'), path.join(root, 'index.html'));
  assert.equal(resolveAppPath(root, 'app://portugol/assets/index.js?v=1#x'), path.join(root, 'assets', 'index.js'));
  assert.equal(resolveAppPath(root, 'app://portugol/exemplos/Jogos%20Simples/a.por'), path.join(root, 'exemplos', 'Jogos Simples', 'a.por'));
});

test('desktop protocol rejects paths outside the build', () => {
  // The URL parser folds literal dot segments back inside the build.
  assert.equal(resolveAppPath(root, 'app://portugol/../package.json'), path.join(root, 'package.json'));
  assert.equal(resolveAppPath(root, 'app://portugol/%2e%2e/package.json'), path.join(root, 'package.json'));
  for (const url of [
    'app://portugol/..%2fpackage.json', 'app://portugol/..%5cpackage.json', 'app://portugol/a/..%2f..%2f..%2fpackage.json', 'app://portugol/a%00.js', 'app://portugol/%E0%A4%A', 'app://other/index.html',
    'file:///etc/passwd', 'not a url',
  ]) assert.equal(resolveAppPath(root, url), null, url);
});

test('desktop navigation separates app and external URLs', () => {
  assert.equal(isAppUrl('app://portugol/index.html'), true);
  assert.equal(isAppUrl('app://evil/index.html'), false);
  assert.equal(isExternalUrl('https://github.com/'), true);
  assert.equal(isExternalUrl('mailto:a@b.c'), true);
  assert.equal(isExternalUrl('file:///C:/Windows'), false);
  assert.equal(isExternalUrl('javascript:alert(1)'), false);
});

const { toAccelerator, buildMenuTemplate } = require('../desktop/menu.cjs');

test('desktop menu converts the IDE shortcuts to accelerators', () => {
  assert.equal(toAccelerator('Ctrl + Shift + S'), 'CmdOrCtrl+Shift+S');
  assert.equal(toAccelerator('Alt + N'), 'Alt+N');
  assert.equal(toAccelerator('Ctrl + Enter'), 'CmdOrCtrl+Enter');
  assert.equal(toAccelerator('Ctrl + Espaço'), 'CmdOrCtrl+Space');
  assert.equal(toAccelerator('Esc'), 'Escape');
  assert.equal(toAccelerator(undefined), undefined);
  assert.equal(toAccelerator('clique na margem'), undefined);
});

test('desktop menu builds native items that report their id without stealing shortcuts', () => {
  const sent = [];
  const template = buildMenuTemplate([
    { label: 'Arquivo', items: [{ id: 'novo', label: 'Novo arquivo', shortcut: 'Alt + N' }, { separator: true }, { id: 'fechar', label: 'Fechar', disabled: true }] },
    { label: 'Exemplos', items: [{ label: 'Jogos', items: [{ id: 'ex:1', label: 'Pong' }] }] },
    { label: 'Editar', items: [{ role: 'copy', label: 'Copiar' }, { role: 'shell' }] },
    { label: 'Exibir', items: [{ id: 'janela', label: 'Gráfico em janela', checked: true }] },
  ], id => sent.push(id), 'win32');
  const [file, examples, edit, view] = template;
  assert.equal(file.label, 'Arquivo');
  assert.deepEqual({ ...file.submenu[0], click: undefined }, { label: 'Novo arquivo', enabled: true, click: undefined, accelerator: 'Alt+N', registerAccelerator: false });
  assert.equal(file.submenu[1].type, 'separator');
  assert.equal(file.submenu[2].enabled, false);
  file.submenu[0].click(); examples.submenu[0].submenu[0].click();
  assert.deepEqual(sent, ['novo', 'ex:1']);
  assert.deepEqual(edit.submenu, [{ role: 'copy', label: 'Copiar' }]);
  assert.equal(view.submenu[0].type, 'checkbox');
  assert.equal(buildMenuTemplate([], () => {}, 'darwin')[0].role, 'appMenu');
});

const { compareVersions, updateMode, parseRelease, DOWNLOAD_PAGE } = require('../desktop/update-policy.cjs');

test('desktop updater compares release versions', () => {
  assert.equal(compareVersions('v3.1.0', '3.0.9'), 1);
  assert.equal(compareVersions('3.0.0', 'v3.0.0'), 0);
  assert.equal(compareVersions('3.0', '3.0.0'), 0);
  assert.equal(compareVersions('3.0.10', '3.0.9'), 1);
  assert.equal(compareVersions('2.9.9', '3.0.0'), -1);
  assert.equal(compareVersions('3.1.0-beta.1', '3.1.0'), 0);
});

test('desktop updater installs only where the package can replace itself', () => {
  const exe = path.join('C:', 'Programas', 'Portugol Studio', 'Portugol Studio.exe');
  const uninstaller = path.join(path.dirname(exe), 'Uninstall Portugol Studio.exe');
  const base = { packaged: true, execPath: exe, env: {}, exists: file => file === uninstaller };
  assert.equal(updateMode({ ...base, packaged: false, platform: 'win32' }), 'off');
  assert.equal(updateMode({ ...base, platform: 'win32' }), 'install');
  assert.equal(updateMode({ ...base, platform: 'win32', exists: () => false }), 'notify');
  assert.equal(updateMode({ ...base, platform: 'linux', env: { APPIMAGE: '/home/a/Portugol.AppImage' } }), 'install');
  assert.equal(updateMode({ ...base, platform: 'linux' }), 'notify');
  assert.equal(updateMode({ ...base, platform: 'darwin' }), 'notify');
});

test('desktop updater reads the latest GitHub release', () => {
  assert.deepEqual(parseRelease({ tag_name: 'v3.2.0', html_url: 'https://github.com/AlissonSteffens/Portugol-Studio-3/releases/tag/v3.2.0' }), { version: '3.2.0', url: 'https://github.com/AlissonSteffens/Portugol-Studio-3/releases/tag/v3.2.0' });
  assert.deepEqual(parseRelease({ tag_name: 'v3.2.0', html_url: 'javascript:alert(1)' }), { version: '3.2.0', url: DOWNLOAD_PAGE });
  assert.equal(parseRelease({ message: 'Not Found' }), null);
});
