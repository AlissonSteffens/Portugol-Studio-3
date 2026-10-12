import { useEffect, useRef, useState } from 'react';
export default function Graphics({ canvas, runtimeRef, title, resolution, onError }) {
  const host = useRef(), external = useRef();
  const [detached, setDetached] = useState(false);
  function restore() {
    const target = external.current;
    if (!target) return;
    runtimeRef.current?.unbindInputWindow(target);
    host.current?.appendChild(canvas);
    external.current = null; setDetached(false);
    if (!target.closed) target.close();
  }
  useEffect(() => {
    host.current.appendChild(canvas);
    return () => { if (external.current) external.current.close(); canvas.remove(); };
  }, [canvas]);
  function detach() {
    if (external.current && !external.current.closed) { external.current.focus(); return; }
    const target = window.open('about:blank', '_blank');
    if (!target) { onError(new Error('O navegador bloqueou a aba. Permita pop-ups para abrir o modo gráfico.')); return; }
    external.current = target;
    target.document.title = title + ' — Portugol Studio';
    const style = target.document.createElement('style');
    style.textContent = 'html,body{margin:0;width:100%;height:100%;background:#1e1f22;overflow:auto}body{display:flex;align-items:center;justify-content:center}canvas{max-width:100%;max-height:100%;object-fit:contain;outline:none}';
    target.document.head.appendChild(style);
    target.document.body.appendChild(canvas);
    runtimeRef.current?.bindInputWindow(target);
    canvas.focus(); setDetached(true);
    target.addEventListener('pagehide', restore, { once: true });
  }
  useEffect(() => { if (external.current) external.current.document.title = title + ' — Portugol Studio'; }, [title]);
  return <section className="panel overflow-hidden">
    <div className="panel-heading"><span>▣ &nbsp; {title}</span><span className="flex items-center gap-3"><small className="text-slate-400">{resolution}</small><button onClick={detached ? restore : detach}>{detached ? 'Trazer para o painel' : 'Abrir em nova aba ↗'}</button></span></div>
    <div ref={host} className={'canvas-host ' + (detached ? 'hidden' : '')} />
    {detached && <div className="p-10 text-center text-sm text-slate-400">Modo gráfico aberto em outra aba.<br/><button className="mt-3" onClick={detach}>Ir para a aba ↗</button></div>}
  </section>;
}
