import { decodeSource } from './examples.js';
export function normalizePath(value) {
  const path = String(value).replaceAll('\\', '/').replace(/^(\.\/)+/, '').replace(/\/{2,}/g, '/');
  if (!path || path.startsWith('/') || /^[a-z]:/i.test(path) || path.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Use um caminho relativo válido.');
  return path;
}
async function request(path, options) {
  const response = await fetch('/api/files' + (path ? '?path=' + encodeURIComponent(normalizePath(path)) : ''), options);
  if (!response.ok) throw new Error((await response.json()).error || 'Falha ao acessar os arquivos.');
  return response;
}
export const repository = {
  async list() { return (await request()).json(); },
  async read(path) { return (await request(path)).blob(); },
  async write(path, blob) { await request(path, { method: 'PUT', body: blob, headers: { 'Content-Type': blob.type || 'text/plain' } }); },
  async remove(path) { await request(path, { method: 'DELETE' }); },
};
export function download(blob, name) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name.split('/').pop(); link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// A API síncrona usa um snapshot; as alterações são persistidas em ordem.
export async function createRuntimeFiles(onChange, onError = console.error, example, localFiles = {}) {
  const files = Object.create(null), blobs = new Map();
  const base = example ? '/exemplos/' + example.caminho.slice(0, example.caminho.lastIndexOf('/') + 1) : null;
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
