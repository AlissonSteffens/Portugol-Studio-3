// Converts the menu model sent by the IDE into an Electron menu template.

/** 'Ctrl + Shift + S' → 'CmdOrCtrl+Shift+S'. Returns undefined for labels that are not shortcuts. */
function toAccelerator(shortcut) {
  if (!shortcut) return undefined;
  const keys = { Ctrl: 'CmdOrCtrl', Espaço: 'Space', Esc: 'Escape', Enter: 'Enter', Alt: 'Alt', Shift: 'Shift' };
  const parts = String(shortcut).split(' + ').map(part => keys[part] || part);
  return parts.every(part => /^[A-Za-z0-9]+$/.test(part) || part === 'CmdOrCtrl') ? parts.join('+') : undefined;
}

// The page handles its own shortcuts; native accelerators are only displayed.
function toTemplate(items, send) {
  return (Array.isArray(items) ? items : []).slice(0, 400).map(item => {
    if (!item || typeof item !== 'object') return null;
    if (item.separator) return { type: 'separator' };
    if (item.role) return ['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll'].includes(item.role) ? { role: item.role, label: String(item.label || '') || undefined } : null;
    const label = String(item.label || '').slice(0, 120);
    if (Array.isArray(item.items)) return { label, submenu: toTemplate(item.items, send) };
    const entry = { label, enabled: !item.disabled, click: () => send(String(item.id)) };
    const accelerator = toAccelerator(item.shortcut);
    if (accelerator) Object.assign(entry, { accelerator, registerAccelerator: false });
    if (item.checked !== undefined) Object.assign(entry, { type: 'checkbox', checked: !!item.checked });
    return entry;
  }).filter(Boolean);
}

function buildMenuTemplate(menus, send, platform = process.platform) {
  const template = (Array.isArray(menus) ? menus : []).slice(0, 12).map(menu => ({ label: String(menu?.label || '').slice(0, 60), submenu: toTemplate(menu?.items, send) }));
  if (platform === 'darwin') template.unshift({ role: 'appMenu' });
  return template;
}

module.exports = { toAccelerator, buildMenuTemplate };
