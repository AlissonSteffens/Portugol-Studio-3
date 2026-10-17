import { useEffect, useRef, useState } from 'react';
export default function FileDialog({ dialog, onClose, onSubmit }) {
  const [name, setName] = useState(dialog.filename), [error, setError] = useState(''), root = useRef();
  const [working, setWorking] = useState(false);
  async function respond(value) {
    if (working) return;
    setWorking(true);
    try { await onSubmit(value); } finally { setWorking(false); }
  }
  useEffect(() => {
    const previous = document.activeElement;
    root.current.querySelector('input, button')?.focus();
    return () => previous?.focus();
  }, []);
  function submit(event) {
    event.preventDefault(); let filename = name.trim();
    if (!filename || /[\\/:*?"<>|\x00-\x1f]/.test(filename)) { setError('Informe um nome de arquivo válido.'); return; }
    if (!filename.toLowerCase().endsWith('.por')) filename += '.por';
    respond(filename);
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); if (!working) onClose(); }
    if (event.key === 'Tab') {
      const items = [...root.current.querySelectorAll('button, input')];
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    }
  }}><section ref={root} role="dialog" aria-modal="true" aria-labelledby="file-dialog-title" className="panel w-full max-w-md p-6"><fieldset disabled={working} className="min-w-0 border-0 p-0"><h2 id="file-dialog-title" className="mb-4 font-semibold">{dialog.kind === 'close' ? 'Alterações não salvas' : 'Salvar como'}</h2>{dialog.kind === 'close' ? <><p className="mb-6 text-sm text-slate-400">O arquivo {dialog.filename} tem alterações. Salve uma cópia antes de fechar ou descarte as alterações.</p>{dialog.localResources && <p className="mb-5 text-xs leading-5 text-amber-200">Há recursos locais nesta aba. Baixe-os no repositório antes de fechar; salvar o .por guarda apenas o código.</p>}<div className="flex flex-wrap justify-end gap-2"><button onClick={onClose}>Cancelar</button><button onClick={() => respond(false)}>Descartar e fechar</button><button className="active-button" onClick={() => respond(true)}>{dialog.localResources ? "Salvar código e fechar" : "Salvar e fechar"}</button></div></> : <form onSubmit={submit}><label className="text-sm">Nome do arquivo<input aria-label="Nome do arquivo" value={name} onChange={event => setName(event.target.value)} className="mt-2 w-full"/></label>{error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose}>Cancelar</button><button className="active-button" type="submit">Salvar arquivo</button></div></form>}</fieldset></section></div>;
}
