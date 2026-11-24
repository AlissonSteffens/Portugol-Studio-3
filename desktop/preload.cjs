// Bridge between the IDE page and the native desktop shell. The page stays sandboxed:
// it only describes its menus and receives the id of the item the user chose.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('portugolDesktop', {
  platform: process.platform,
  setMenu: menus => ipcRenderer.send('menu:set', menus),
  onMenuCommand: callback => {
    const listener = (_event, id) => callback(id);
    ipcRenderer.on('menu:command', listener);
    return () => ipcRenderer.removeListener('menu:command', listener);
  },
});
