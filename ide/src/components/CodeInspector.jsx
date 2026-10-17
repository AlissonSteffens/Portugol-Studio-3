import QuickFix from './QuickFix.jsx';
import { useRef, useState } from 'react';
import { ChevronRight, CircleAlert, TriangleAlert, CheckCheck, FunctionSquare, Variable, Diamond, Brackets, FolderCode, Files, ListTree, PanelRightClose } from 'lucide-react';

function SymbolTree({ symbols, values, onNavigate }) {
  const [closed, setClosed] = useState(new Set()), [openedArrays, setOpenedArrays] = useState(new Set()), [selected, setSelected] = useState(null);
  const tree = useRef();
  const toggle = (id, array) => {
    const setter = array ? setOpenedArrays : setClosed;
    setter(current => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const render = (symbol, level = 1) => {
    const value = symbol.elementValue ?? values[`${symbol.scope}:${symbol.from}`];
    let array;
    if (symbol.kind !== 'function' && value !== undefined) { try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) array = parsed; } catch { /* O valor escalar já está formatado pelo runtime. */ } }
    const isArray = !!array, children = isArray ? array.slice(0, 100).map((item, index) => ({ id: `${symbol.id}[${index}]`, name: `[${index}]`, type: symbol.type, dimensions: (symbol.dimensions || []).slice(1), kind: 'variable', elementValue: JSON.stringify(item), from: symbol.from, children: [] })) : symbol.children || [];
    const expandable = children.length > 0, expanded = isArray ? openedArrays.has(symbol.id) : !closed.has(symbol.id);
    const Icon = symbol.group ? FolderCode : symbol.kind === 'function' ? FunctionSquare : symbol.constant ? Diamond : symbol.dimensions?.length ? Brackets : Variable;
    const select = () => { setSelected(symbol.id); if (symbol.group) toggle(symbol.id, false); else onNavigate(symbol.from); };
    const key = event => {
      if (event.target.closest('[role=treeitem]') !== event.currentTarget) return;
      const rows = [...tree.current.querySelectorAll('[role=treeitem]')], index = rows.indexOf(event.currentTarget);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); rows[event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1 : Math.max(0, Math.min(rows.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))]?.focus();
      } else if (event.key === 'ArrowRight') { event.preventDefault(); if (expandable && !expanded) toggle(symbol.id, isArray); else event.currentTarget.querySelector('[role=group] [role=treeitem]')?.focus(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); if (expandable && expanded) toggle(symbol.id, isArray); else event.currentTarget.parentElement.closest('[role=treeitem]')?.focus(); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
    };
    return <li key={symbol.id} role="treeitem" aria-label={symbol.name} aria-level={level} aria-expanded={expandable ? expanded : undefined} aria-selected={selected === symbol.id} tabIndex={0} onKeyDown={key}>
      <div className={`tree-row ${symbol.group ? 'tree-group-row' : ''} ${symbol.kind === 'function' ? 'tree-function' : ''}`}>
        {expandable ? <button className="tree-disclosure" tabIndex={-1} aria-label={`${expanded ? 'Recolher' : 'Expandir'} ${symbol.name}`} onClick={() => toggle(symbol.id, isArray)}><ChevronRight size={13} className={expanded ? 'is-expanded' : ''}/></button> : <span className="tree-disclosure"/>}
        <Icon size={14} className={`tree-icon ${symbol.constant ? 'tree-constant' : ''} ${symbol.parameter ? 'tree-parameter' : ''}`}/>
        <button className="tree-symbol-name" tabIndex={-1} onClick={select} title={symbol.group ? symbol.name : `Ir para ${symbol.name}`}><span>{symbol.name}{symbol.kind === 'function' ? '()' : ''}</span></button>
        {symbol.group ? <span className="tree-count">{children.length}</span> : <><small className="tree-type">{symbol.type}{'[]'.repeat(symbol.dimensions?.length || 0)}</small>{symbol.kind !== 'function' && <code className="symbol-value" title={value === undefined ? 'Ainda não executada' : value}>{value === undefined ? '—' : isArray ? `[${array.length}]` : value}</code>}</>}
      </div>
      {expandable && expanded && <ul role="group" className="tree-branches">{children.map(child => render(child, level + 1))}{isArray && array.length > 100 && <li role="none" className="tree-more">Mais {array.length - 100} elementos</li>}</ul>}
    </li>;
  };
  const globals = symbols.filter(item => item.kind !== 'function'), functions = symbols.filter(item => item.kind === 'function');
  return <ul ref={tree} role="tree" aria-label="Símbolos do programa" className="symbol-tree">{globals.length > 0 && render({ id: 'globals', name: 'Variáveis globais', group: true, children: globals })}{functions.length > 0 && render({ id: 'functions', name: 'Funções', group: true, children: functions })}</ul>;
}

export default function CodeInspector({ code, diagnostics, symbols, values, onNavigate, busy, paused, onFix, tab, onTabChange, onCollapse, resources }) {
  const [filter, setFilter] = useState('all');
  const errors = diagnostics.filter(item => item.severity === 'error').length, warnings = diagnostics.length - errors;
  const line = from => code.slice(0, from).split('\n').length;
  const tabs = [{ id: 'messages', label: 'Mensagens', icon: CircleAlert }, { id: 'symbols', label: 'Árvore do código', icon: ListTree }, { id: 'resources', label: 'Recursos', icon: Files }];
  const visible = diagnostics.filter(item => filter === 'all' || filter === item.severity);
  return <aside className="code-inspector" aria-label="Ferramentas do programa">
    <nav className="inspector-tabs" aria-label="Ferramentas do programa">{tabs.map(item => <button key={item.id} aria-label={item.label} aria-pressed={tab === item.id} title={item.label} onClick={() => onTabChange(item.id)}><item.icon size={15}/><span>{item.id === 'symbols' ? 'Árvore' : item.label}</span>{item.id === 'messages' && diagnostics.length > 0 && <span className={`inspector-badge ${errors ? 'has-errors' : ''}`}>{diagnostics.length}</span>}</button>)}<button className="inspector-close" aria-label="Recolher lateral" title="Recolher lateral" onClick={onCollapse}><PanelRightClose size={15}/></button></nav>
    {tab === 'messages' && <><div className="message-filters">{[['all', 'Todas'], ['error', `${errors} ${errors === 1 ? 'erro' : 'erros'}`], ['warning', `${warnings} ${warnings === 1 ? 'aviso' : 'avisos'}`]].map(([id, label]) => <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div><div className="inspector-content" aria-live="polite">{visible.map((item, index) => <div key={index} data-diagnostic-code={item.code} className={`diagnostic-row ${item.severity}`} ><button className="diagnostic-main" onClick={() => onNavigate(item.from)}><span className="diagnostic-icon">{item.severity === 'error' ? <CircleAlert size={15}/> : <TriangleAlert size={15}/>}</span><span className="diagnostic-description"><strong>{item.severity === 'error' ? 'Erro' : 'Aviso'} <small>Linha {line(item.from)}</small></strong><span>{item.message}</span></span></button><QuickFix fixes={item.fixes} disabled={busy} onFix={onFix}/></div>)}{!visible.length && <div className="inspector-empty"><CheckCheck size={27}/><strong>{diagnostics.length ? 'Nenhuma mensagem neste filtro' : 'Tudo certo por aqui'}</strong><span>{diagnostics.length ? 'Escolha outro filtro para ver as mensagens.' : 'Os erros e avisos aparecem aqui enquanto você escreve.'}</span></div>}</div></>}
    <div className={`inspector-tree-section ${tab === 'symbols' ? '' : 'hidden'}`}><div className="inspector-caption"><span className={busy ? 'tree-live-dot is-live' : 'tree-live-dot'}/>{busy ? 'Valores em execução' : Object.keys(values).length ? 'Últimos valores da execução' : 'Estrutura do programa'}</div><div className="inspector-content tree-content">{paused && <div className="debug-stack"><strong>Pilha de chamadas</strong>{[...paused.frames].reverse().map((frame, index) => <details key={index} open={index === 0}><summary>{frame.name}() · linha {line(frame.from || paused.from)}</summary>{frame.symbols.map(symbol => <div key={symbol.from}>{symbol.name}<code>{JSON.stringify(symbol.value) ?? "—"}</code></div>)}</details>)}</div>}<SymbolTree symbols={symbols} values={values} onNavigate={onNavigate}/>{!symbols.length && <div className="inspector-empty"><ListTree size={27}/><span>A árvore aparece quando o código pode ser analisado.</span></div>}</div></div>
    <div className={`workspace-repository ${tab === 'resources' ? '' : 'hidden'}`}>{resources}</div>
  </aside>;
}
