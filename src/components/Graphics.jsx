import { ChevronDown, ExternalLink, Square, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { mountTouchControls } from '../../runtime/core/touch-controls.js';

function TouchControls({ runtimeRef, profile, enabled, status }) {
  const host = useRef();
  useEffect(() => {
    if (enabled && runtimeRef.current) return mountTouchControls(runtimeRef.current, host.current, profile);
  }, [enabled, status, profile, runtimeRef]);
  return <div ref={host} className="touch-controls-host"/>;
}

const detachedStyle = `
  *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#1e1e1e;color:#bcbec4;font:13px "Segoe UI",sans-serif}
  body{display:flex;flex-direction:column;overflow:hidden}header{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 14px;background:#181818;border-bottom:1px solid #303030;flex-shrink:0}
  header strong{font-size:12px;font-weight:500;min-width:0;overflow-wrap:anywhere}header small{color:#92959c;font-size:11px}header .execution-actions{display:flex;gap:8px;margin-left:auto}
  button{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid #454545;border-radius:4px;background:transparent;color:#bcbec4;cursor:pointer;font:12px "Segoe UI",sans-serif}button:hover{background:#ffffff0a}button:disabled{opacity:.4;cursor:default}
  .execution-stage{display:flex;align-items:center;justify-content:center;flex:1;min-height:0;overflow:auto;padding:12px;background:#151515}
  canvas{max-width:100%;max-height:100%;object-fit:contain;outline:none;flex-shrink:0}canvas:focus-visible{box-shadow:0 0 0 2px #ffc200}
  .execution-terminal{flex:0 1 25%;min-height:95px;display:flex;flex-direction:column;border-top:1px solid #303030;overflow:hidden}
  .terminal-title{padding:7px 14px;background:#202020;color:#92959c;font-size:11px}
  .terminal{flex:1;min-height:0;padding:10px 14px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.7 Consolas,monospace;color:#b7d6bd}
  .terminal input{background:#181818;color:#dfe1e5;border:1px solid #454545;padding:5px 8px;max-width:100%;font:inherit;border-radius:4px;outline:none}.terminal input:focus{border-color:#ffc200}
  @media(max-width:480px){header .execution-actions{margin-left:0}.execution-stage{padding:6px}.execution-terminal{flex-basis:30%}}
`;

export default function Graphics({ onCollapse, canvas, runtimeRef, terminalRef, title, resolution, status, busy, paused, onStop, onDetachedChange, onError, controls, inputProfile, inputEnabled }) {
  const host = useRef(), external = useRef();
  const [detached, setDetached] = useState(false);
  function restore(notify = true) {
    const entry = external.current;
    if (!entry) return;
    external.current = null;
    entry.target.removeEventListener('pagehide', entry.onClose);
    runtimeRef.current?.unbindInputWindow(entry.target);
    host.current?.appendChild(canvas);
    runtimeRef.current?.setPresentationWindow(canvas.ownerDocument.defaultView);
    if (entry.anchor?.parentNode) entry.anchor.replaceWith(entry.terminal);
    if (notify) { setDetached(false); onDetachedChange?.(false); }
    if (!entry.target.closed) entry.target.close();
  }
  useEffect(() => {
    host.current.appendChild(canvas);
    return () => { restore(false); canvas.remove(); };
  }, [canvas]);
  function detach() {
    if (external.current && !external.current.target.closed) { external.current.target.focus(); return; }
    const target = window.open('about:blank', '_blank');
    if (!target) { onError(new Error('O navegador bloqueou a aba. Permita pop-ups para abrir a execução.')); return; }
    const doc = target.document;
    doc.documentElement.lang = 'pt-BR'; doc.title = title + ' — Portugol Studio';
    const style = doc.createElement('style'); style.textContent = detachedStyle; doc.head.append(style);
    const viewport = doc.createElement('meta'); viewport.name = 'viewport'; viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover'; doc.head.append(viewport);
    const controls = doc.createElement('header'), stage = doc.createElement('main'); stage.className = 'execution-stage'; stage.setAttribute('aria-label', 'Execução gráfica');
    const touchHost = doc.createElement('div');
    const terminalHost = doc.createElement('section'); terminalHost.className = 'execution-terminal';
    const caption = doc.createElement('div'); caption.className = 'terminal-title'; caption.textContent = 'Terminal'; terminalHost.append(caption);
    doc.body.append(controls, stage, touchHost, terminalHost);
    const terminal = terminalRef.current, anchor = terminal.ownerDocument.createComment('terminal na aba de execução');
    terminal.before(anchor); stage.append(canvas); terminalHost.append(terminal);
    const onClose = () => restore();
    external.current = { target, controls, touchHost, terminal, anchor, onClose };
    runtimeRef.current?.bindInputWindow(target);
    runtimeRef.current?.setPresentationWindow(target);
    target.addEventListener('pagehide', onClose, { once: true });
    target.focus(); canvas.focus(); setDetached(true); onDetachedChange?.(true);
  }
  useEffect(() => { if (external.current) external.current.target.document.title = title + ' — Portugol Studio'; }, [title]);
  const touchControls = <TouchControls runtimeRef={runtimeRef} profile={inputProfile} enabled={busy && !paused && (detached || inputEnabled)} status={status}/>;
  return <section className="panel graphics-panel overflow-hidden">
    <div className="panel-heading"><span>▣ &nbsp; {title}</span><span className="flex items-center gap-3"><small className="text-slate-400">{resolution}</small><button onClick={detached ? () => restore() : detach}>{detached ? 'Trazer para o painel' : 'Abrir em nova aba ↗'}</button><button aria-label="Recolher gráfico" title="Recolher gráfico" onClick={onCollapse}><ChevronDown size={14}/></button></span></div>
    {controls && !detached && <p className="graphics-controls">{controls}</p>}
    <div ref={host} className={'canvas-host ' + (detached ? 'hidden' : '')}/>
    {detached ? createPortal(touchControls, external.current.touchHost) : touchControls}
    {detached && <><div className="detached-notice"><ExternalLink size={22}/><span>Execução aberta em outra aba</span><small>Gráfico, teclado, mouse e terminal continuam ativos.</small><button onClick={detach}>Ir para a aba ↗</button></div>{createPortal(<><strong>{title}</strong><small>{resolution} · {status}</small>{controls && <small>{controls}</small>}<div className="execution-actions"><button disabled={!busy} onClick={onStop}><Square size={13}/>Parar execução</button><button onClick={() => restore()}><Undo2 size={13}/>Trazer para o editor</button></div></>, external.current.controls)}</>}
  </section>;
}
