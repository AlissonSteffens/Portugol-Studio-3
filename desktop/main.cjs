const { app, BrowserWindow, session } = require('electron');
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  const window = new BrowserWindow({ width: 1100, height: 800, autoHideMenuBar: true, webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.loadFile('index.html');
});
app.on('window-all-closed', () => app.quit());
