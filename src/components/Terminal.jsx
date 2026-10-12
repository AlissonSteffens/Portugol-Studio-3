import { ChevronDown } from 'lucide-react';
export default function Terminal({ terminalRef, clear, onCollapse, detached, onFocusExecution }) {
  return <section className="panel flex min-h-52 flex-1 flex-col overflow-hidden">
    <div className="panel-heading"><span>›_ &nbsp; Terminal</span><span className="flex items-center gap-2"><button onClick={clear}>Limpar</button><button aria-label="Recolher terminal" title="Recolher terminal" onClick={onCollapse}><ChevronDown size={14}/></button></span></div>
    {detached && <div className="detached-notice"><span>Terminal aberto na aba de execução.</span><button onClick={onFocusExecution}>Ir para a aba ↗</button></div>}
    <div className="terminal-slot"><div ref={terminalRef} className="terminal flex-1" aria-label="Terminal de execução" aria-live="polite" /></div>
  </section>;
}
