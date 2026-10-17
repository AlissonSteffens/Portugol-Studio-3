import { download } from './repository.js';

export function canChooseSaveLocation() {
  return typeof window !== 'undefined' && window.isSecureContext && typeof window.showSaveFilePicker === 'function';
}

// Invoke the picker before reading resources: it requires the original click's activation.
export async function saveFile(contents, name, { source = false } = {}) {
  try {
    if (canChooseSaveLocation()) {
      const handle = await window.showSaveFilePicker({
        suggestedName: name.split('/').pop(),
        ...(source ? { types: [{ description: 'Código Portugol', accept: { 'text/plain': ['.por'] } }] } : {}),
      });
      const blob = typeof contents === 'function' ? await contents() : contents;
      const writable = await handle.createWritable();
      try { await writable.write(blob); await writable.close(); }
      catch (error) { await writable.abort().catch(() => {}); throw error; }
      return { name: handle.name, downloaded: false };
    }
    const blob = typeof contents === 'function' ? await contents() : contents;
    download(blob, name);
    return { name: name.split('/').pop(), downloaded: true };
  } catch (error) {
    if (error.name === 'AbortError') return null;
    throw error;
  }
}
