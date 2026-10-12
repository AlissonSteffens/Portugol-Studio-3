export function normalizeProjectPath(value) {
  const path = String(value).replaceAll('\\', '/').replace(/^(\.\/)+/, '').replace(/\/{2,}/g, '/');
  if (!path || path.startsWith('/') || /^[a-z]:/i.test(path) || path.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Use um caminho relativo válido.');
  return path;
}
function decode(bytes) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return new TextDecoder('windows-1252').decode(bytes); }
}
// Adaptador independente: arquivos incorporados, gravações persistidas e imagens.
export async function createProjectFiles(assets = [], { projectId, onChange = () => {}, onError = console.error } = {}) {
  const files = Object.create(null), blobs = new Map(); let db, failure, queue = Promise.resolve();
  for (const asset of assets) {
    const path = normalizeProjectPath(asset.path), bytes = Uint8Array.from(atob(asset.data), char => char.charCodeAt(0));
    blobs.set(path, new Blob([bytes], { type: asset.type })); files[path] = decode(bytes);
  }
  if (projectId && typeof indexedDB !== 'undefined') {
    try {
      db = await new Promise((resolve, reject) => { const request = indexedDB.open('portugol-project-' + projectId, 1); request.onupgradeneeded = () => request.result.createObjectStore('files'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
      const saved = await new Promise((resolve, reject) => { const rows = []; const transaction = db.transaction('files'); const request = transaction.objectStore('files').openCursor(); request.onsuccess = () => { const cursor = request.result; if (cursor) { rows.push([cursor.key, cursor.value]); cursor.continue(); } }; transaction.oncomplete = () => resolve(rows); transaction.onerror = () => reject(transaction.error); });
      for (const [path, blob] of saved) { if (blob === null) { blobs.delete(path); delete files[path]; } else { blobs.set(path, blob); files[path] = decode(new Uint8Array(await blob.arrayBuffer())); } }
    } catch (error) { onError(error); db?.close(); db = null; }
  }
  function persist(path, blob) {
    onChange();
    if (!db) return;
    queue = queue.then(() => new Promise((resolve, reject) => { const transaction = db.transaction('files', 'readwrite'); transaction.objectStore('files').put(blob, path); transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); })).catch(error => { failure ||= error; onError(error); });
  }
  return {
    files, normalizePath: normalizeProjectPath,
    async blob(path) { path = normalizeProjectPath(path); const blob = blobs.get(path); if (!blob) throw new Error('Arquivo não encontrado: ' + path); return blob; },
    write(path, text) { path = normalizeProjectPath(path); files[path] = text; const blob = new Blob([text], { type: 'text/plain;charset=utf-8' }); blobs.set(path, blob); persist(path, blob); },
    remove(path) { path = normalizeProjectPath(path); delete files[path]; blobs.delete(path); persist(path, null); },
    async writeBlob(path, blob) { path = normalizeProjectPath(path); blobs.set(path, blob); files[path] = decode(new Uint8Array(await blob.arrayBuffer())); persist(path, blob); },
    async image(path) { const url = URL.createObjectURL(await this.blob(path)); try { const image = new Image(); image.src = url; await image.decode(); return image; } finally { URL.revokeObjectURL(url); } },
    list() { return [...blobs].map(([path, blob]) => ({ path, size: blob.size })); },
    async flush() { await queue; if (failure) throw failure; },
    async close() { await queue; db?.close(); },
  };
}
