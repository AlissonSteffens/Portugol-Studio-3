import { normalizeStudioDocument, splitStudioMetadata } from '../services/studio-metadata.js';
import { documentFiles } from '../services/storage.js';
import { useEffect, useState } from 'react';
import { readStored } from './useStoredState.js';
const KEY = 'portugol-studio-documents-v1';
const validSession = value => Array.isArray(value?.documents) && value.documents.length > 0 && value.documents.every(document => typeof document.id === 'string' && typeof document.filename === 'string' && typeof document.code === 'string' && typeof document.savedCode === 'string');
const blank = 'programa\n{\n    funcao inicio()\n    {\n        \n    }\n}\n';
export default function useDocuments(starter) {
  const [session] = useState(() => {
    const stored = readStored(KEY, { documents: [{ id: 'initial', filename: 'programa.por', code: starter, savedCode: starter, exampleId: '' }], activeId: 'initial' }, validSession);
    return { ...stored, documents: stored.documents.map(normalizeStudioDocument) };
  });
  const [documents, setDocuments] = useState(session.documents);
  const [activeId, setActiveId] = useState(session.activeId);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    let alive = true;
    Promise.all(session.documents.map(async document => [document.id, await documentFiles.read(document.id)])).then(files => {
      if (alive) { const byId = new Map(files); setDocuments(current => current.map(document => ({ ...document, localFiles: byId.get(document.id) || {} }))); setReady(true); }
    }).catch(error => { console.error(error); if (alive) { setStorageError(error.message); setReady(true); } });
    return () => { alive = false; };
  }, [session]);
  useEffect(() => {
    const persist = () => {
      try { localStorage.setItem(KEY, JSON.stringify({ activeId, documents: documents.map(({ id, filename, code, savedCode, exampleId, studioMetadata }) => ({ id, filename, code, savedCode, exampleId, studioMetadata })) })); }
      catch (error) { console.warn('Não foi possível guardar os códigos desta sessão.', error); }
    };
    const timer = setTimeout(persist, 300);
    window.addEventListener('pagehide', persist);
    return () => { clearTimeout(timer); persist(); window.removeEventListener('pagehide', persist); };
  }, [documents, activeId]);
  const active = documents.find(document => document.id === activeId) || documents[0];
  function update(patch, id = active.id) {
    if (Object.hasOwn(patch, 'code')) {
      const source = splitStudioMetadata(patch.code);
      patch = { ...patch, code: source.code, ...(source.studioMetadata ? { studioMetadata: source.studioMetadata } : {}) };
    }
    if (Object.hasOwn(patch, 'savedCode')) patch = { ...patch, savedCode: splitStudioMetadata(patch.savedCode).code };
    const apply = () => setDocuments(current => current.map(document => document.id === id ? { ...document, ...patch } : document));
    if (Object.hasOwn(patch, 'localFiles')) return documentFiles.write(id, patch.localFiles).then(apply);
    apply();
  }
  function create({ filename, code = blank, exampleId = '' } = {}) {
    const id = crypto.randomUUID();
    setDocuments(current => {
      let index = 1;
      while (current.some(document => document.filename === `sem_titulo_${index}.por`)) index++;
      return [...current, normalizeStudioDocument({ id, filename: filename || `sem_titulo_${index}.por`, code, savedCode: code, exampleId })];
    });
    setActiveId(id); return id;
  }
  function close(id) {
    documentFiles.remove(id).catch(error => { console.error(error); setStorageError(error.message); });
    const remaining = documents.filter(document => document.id !== id);
    if (!remaining.length) {
      const fresh = { id: crypto.randomUUID(), filename: 'sem_titulo.por', code: blank, savedCode: blank, exampleId: '' };
      setDocuments([fresh]); setActiveId(fresh.id);
    } else { setDocuments(remaining); if (id === activeId) setActiveId(remaining.at(-1).id); }
  }
  return { documents, active, ready, storageError, activate: setActiveId, update, create, close };
}
