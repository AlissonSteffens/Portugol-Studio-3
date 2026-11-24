const path = require('node:path');

// The site is served from app://portugol/ (the IDE at /app/) so absolute Vite paths, fetch() and
// secure-context APIs (showSaveFilePicker, IndexedDB) behave as on the web.
const SCHEME = 'app';
const HOST = 'portugol';
const ORIGIN = `${SCHEME}://${HOST}`;
const START_URL = `${ORIGIN}/app/`;

/** Maps an app:// URL to a file inside root, or null when it must not be served. */
function resolveAppPath(root, requestUrl) {
  let url;
  try { url = new URL(requestUrl); } catch { return null; }
  if (url.protocol !== `${SCHEME}:` || url.host !== HOST) return null;
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return null; }
  // Reject on every system what any system would read as a separator or a parent folder,
  // so the same URL behaves alike on Windows, macOS and Linux.
  if (/[\0\\]/.test(pathname) || pathname.split('/').includes('..')) return null;
  if (pathname === '') pathname = '/';
  if (pathname.endsWith('/')) pathname += 'index.html';
  const base = path.resolve(root);
  const target = path.resolve(base, '.' + pathname);
  return target.startsWith(base + path.sep) ? target : null;
}

function isAppUrl(value) {
  try { const url = new URL(value); return url.protocol === `${SCHEME}:` && url.host === HOST; } catch { return false; }
}

function isExternalUrl(value) {
  try { return ['http:', 'https:', 'mailto:'].includes(new URL(value).protocol); } catch { return false; }
}

module.exports = { SCHEME, HOST, ORIGIN, START_URL, resolveAppPath, isAppUrl, isExternalUrl };
