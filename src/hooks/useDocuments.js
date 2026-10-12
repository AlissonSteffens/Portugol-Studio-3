import { useState } from 'react';
const blank = 'programa\n{\n    funcao inicio()\n    {\n        \n    }\n}\n';
export default function useDocuments(starter) {
  const [documents, setDocuments] = useState([{ id: 'initial', filename: 'programa.por', code: starter, savedCode: starter, exampleId: '' }]);
  const [activeId, setActiveId] = useState('initial');
  const active = documents.find(document => document.id === activeId) || documents[0];
  function update(patch, id = active.id) {
    setDocuments(current => current.map(document => document.id === id ? { ...document, ...patch } : document));
  }
  function create({ filename, code = blank, exampleId = '' } = {}) {
    const id = crypto.randomUUID();
    setDocuments(current => {
      let index = 1;
      while (current.some(document => document.filename === `sem_titulo_${index}.por`)) index++;
      return [...current, { id, filename: filename || `sem_titulo_${index}.por`, code, savedCode: code, exampleId }];
    });
    setActiveId(id); return id;
  }
  function close(id) {
    const remaining = documents.filter(document => document.id !== id);
    if (!remaining.length) {
      const fresh = { id: crypto.randomUUID(), filename: 'sem_titulo.por', code: blank, savedCode: blank, exampleId: '' };
      setDocuments([fresh]); setActiveId(fresh.id);
    } else { setDocuments(remaining); if (id === activeId) setActiveId(remaining.at(-1).id); }
  }
  return { documents, active, activate: setActiveId, update, create, close };
}
