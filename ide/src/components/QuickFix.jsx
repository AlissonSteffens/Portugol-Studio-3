import { ChevronDown, Lightbulb } from 'lucide-react';

export default function QuickFix({ fixes, onFix, disabled }) {
  if (!fixes?.length) return null;
  return <details className="quick-fix" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}>
    <summary className="diagnostic-fix"><Lightbulb size={14}/><span>Correção rápida</span><ChevronDown size={12}/></summary>
    <div className="quick-fix-menu" role="group" aria-label="Correções disponíveis">{fixes.map(fix => <button key={fix.label} disabled={disabled} onClick={event => { event.currentTarget.closest('details').open = false; onFix(fix); }}><span>{fix.label}</span></button>)}</div>
  </details>;
}
