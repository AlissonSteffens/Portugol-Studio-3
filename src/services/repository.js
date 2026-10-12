import { decodeSource } from './examples.js';
import { storedOperation } from './storage.js';
import { assetUrl } from './assets.js';
export function normalizePath(value) {
  const path = String(value).replaceAll('\\', '/').replace(/^(\.\/)+/, '').replace(/\/{2,}/g, '/');
  if (!path || path.startsWith('/') || /^[a-z]:/i.test(path) || path.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Use um caminho relativo válido.');
  return path;
}
export const repository = {
  async list() {
    const files = await storedOperation('files', 'readonly', store => store.getAll());
    return files.map(({ path, size, type, updatedAt }) => ({ path, size, type, updatedAt })).sort((a, b) => a.path.localeCompare(b.path, 'pt-BR'));
  },
  async read(path) {
    const file = await storedOperation('files', 'readonly', store => store.get(normalizePath(path)));
    if (!file) throw new Error('Arquivo não encontrado no navegador: ' + path);
    return file.blob;
  },
  async write(path, blob) {
    path = normalizePath(path);
    await storedOperation('files', 'readwrite', store => store.put({ path, blob, size: blob.size, type: blob.type || 'application/octet-stream', updatedAt: Date.now() }));
  },
  async remove(path) { await storedOperation('files', 'readwrite', store => store.delete(normalizePath(path))); },
};
export function download(blob, name) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name.split('/').pop(); link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// A API síncrona usa um snapshot; as alterações são persistidas em ordem.
export async function createRuntimeFiles(onChange, onError = console.error, example, localFiles = {}) {
  const files = Object.create(null), blobs = new Map();
  const base = example ? assetUrl('exemplos/' + example.caminho.slice(0, example.caminho.lastIndexOf('/') + 1)) : null;
  async function blobFor(path) {
    path = normalizePath(path);
    if (blobs.has(path)) return blobs.get(path);
    if (!base) throw new Error('Arquivo não encontrado no repositório: ' + path);
    const response = await fetch(base + path.split('/').map(encodeURIComponent).join('/'));
    if (!response.ok) throw new Error('Recurso do exemplo não encontrado: ' + path);
    const blob = await response.blob(); blobs.set(path, blob); return blob;
  }
  for (const path of example?.recursos || []) {
    if (/\.(txt|db|lvl|pln|iso)$/i.test(path)) files[path] = decodeSource(await (await blobFor(path)).arrayBuffer());
  }
  for (const entry of await repository.list()) {
    const blob = await repository.read(entry.path);
    blobs.set(entry.path, new Blob([blob], { type: entry.type }));
    files[entry.path] = decodeSource(await blob.arrayBuffer());
  }
  // Recursos locais da aba têm prioridade sobre o servidor e os originais do exemplo.
  for (const [path, blob] of Object.entries(localFiles)) {
    blobs.set(normalizePath(path), blob);
    files[normalizePath(path)] = decodeSource(await blob.arrayBuffer());
  }
  let queue = Promise.resolve(), failure;
  function enqueue(action) {
    queue = queue.then(action).then(onChange).catch(error => { failure ||= error; onError(error); });
  }
  return {
    files, normalizePath, blob: blobFor,
    write(path, text) {
      path = normalizePath(path);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      blobs.set(path, blob); enqueue(() => repository.write(path, blob));
    },
    remove(path) { path = normalizePath(path); blobs.delete(path); enqueue(() => repository.remove(path)); },
    async writeBlob(path, blob) {
      path = normalizePath(path); blobs.set(path, blob); files[path] = await blob.text();
      enqueue(() => repository.write(path, blob));
    },
    async image(path) {
      const blob = await blobFor(path);
      const url = URL.createObjectURL(blob);
      try { const image = new Image(); image.src = url; await image.decode(); return image; }
      finally { URL.revokeObjectURL(url); }
    },
    async flush() { await queue; if (failure) throw failure; },
  };
}
