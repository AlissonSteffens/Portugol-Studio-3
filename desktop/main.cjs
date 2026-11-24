const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, Menu, dialog, ipcMain, net, protocol, session, shell } = require('electron');
const { SCHEME, START_URL, resolveAppPath, isAppUrl, isExternalUrl } = require('./protocol.cjs');
const { buildMenuTemplate } = require('./menu.cjs');

// Packaged builds carry the site in app/dist; in development it comes from the repository build.
const root = path.join(__dirname, '..', 'dist');
const allowedPermissions = new Set(['pointerLock', 'fullscreen', 'clipboard-sanitized-write', 'fileSystem', 'speaker-selection']);

protocol.registerSchemesAsPrivileged([{
  scheme: SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true },
}]);

if (!app.requestSingleInstanceLock()) app.quit();

function createWindow() {
  const window = new BrowserWindow({
    width: 1280, height: 860, minWidth: 360, minHeight: 480, show: false,
    title: 'Portugol Studio', backgroundColor: '#1e1e1e',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, spellcheck: false, preload: path.join(__dirname, 'preload.cjs') },
  });
  const { webContents } = window;
  mainWindows.add(webContents);
  window.on('closed', () => mainWindows.delete(webContents));
  // Graphics programs run in an about:blank window that the IDE writes itself.
  webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'about:blank') return { action: 'allow', overrideBrowserWindowOptions: { width: 960, height: 820, minWidth: 320, minHeight: 280, backgroundColor: '#1e1e1e', icon: path.join(__dirname, 'icon.png') } };
    if (isExternalUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  webContents.on('did-create-window', child => { if (process.platform !== 'darwin') child.removeMenu(); });
  webContents.on('will-navigate', (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    if (isExternalUrl(url)) shell.openExternal(url);
  });
  // Electron cancels the close silently on beforeunload; ask like a browser would.
  webContents.on('will-prevent-unload', event => {
    const choice = dialog.showMessageBoxSync(window, {
      type: 'warning', buttons: ['Sair sem salvar', 'Cancelar'], defaultId: 1, cancelId: 1, noLink: true,
      title: 'Portugol Studio', message: 'Há alterações não salvas.', detail: 'Se sair agora, as alterações que não foram salvas em arquivo podem ser perdidas.',
    });
    if (choice === 0) event.preventDefault();
  });
  window.once('ready-to-show', () => window.show());
  window.loadURL(START_URL);
  return window;
}

const mainWindows = new Set();

// Until the IDE sends its menus: macOS still needs an Edit menu for Cmd+C/V/Z.
function installMenu() {
  if (process.platform !== 'darwin') { Menu.setApplicationMenu(null); return; }
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]));
}

// The IDE describes File/Edit/Run/View/Help; the native menu sends the chosen item back.
ipcMain.on('menu:set', (event, menus) => {
  if (!mainWindows.has(event.sender)) return;
  const window = BrowserWindow.fromWebContents(event.sender);
  const template = buildMenuTemplate(menus, id => { if (!event.sender.isDestroyed()) event.sender.send('menu:command', id); });
  if (process.platform === 'darwin') template.push({ role: 'windowMenu' });
  const menu = Menu.buildFromTemplate(template);
  if (process.platform === 'darwin') Menu.setApplicationMenu(menu);
  else window?.setMenu(menu);
});

app.on('second-instance', () => {
  const [window] = BrowserWindow.getAllWindows();
  if (window) { if (window.isMinimized()) window.restore(); window.focus(); }
});

app.whenReady().then(() => {
  protocol.handle(SCHEME, request => {
    const file = resolveAppPath(root, request.url);
    if (!file) return new Response('Não encontrado.', { status: 404 });
    return net.fetch(pathToFileURL(file).toString(), { headers: request.headers }).catch(() => new Response('Não encontrado.', { status: 404 }));
  });
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => callback(allowedPermissions.has(permission)));
  session.defaultSession.setPermissionCheckHandler((_contents, permission) => allowedPermissions.has(permission));
  installMenu();
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
