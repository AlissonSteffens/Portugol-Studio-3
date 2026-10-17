import { diagnosticMessage } from '../editor/diagnostic-message.js';
import { Compartment } from '@codemirror/state';
import { debugExtensions, executionPosition, breakpointLines } from '../editor/debug.js';
import { setDiagnostics, lintGutter } from '@codemirror/lint';
import { useEffect, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { EditorState, Transaction, Prec } from '@codemirror/state';
import { EditorView, keymap, hoverTooltip } from '@codemirror/view';
import { indentUnit, foldService } from '@codemirror/language';
import { indentWithTab, undo, redo, undoDepth, redoDepth } from '@codemirror/commands';
import { autocompletion, acceptCompletion, startCompletion } from '@codemirror/autocomplete';
import { portugolLanguage, portugolHighlight, portugolCompletions, portugolHover } from '../editor/portugol.js';
import { tokenize } from '../../../core/lexical/tokenizer.js';
import { Save, Sparkles, Play, Pause, ArrowDownToLine, CornerDownRight, ArrowUpFromLine, Square } from 'lucide-react';

const theme = EditorView.theme({
  '&': { height: '100%', color: '#bcbec4', backgroundColor: 'var(--color-background)' },
  '.cm-content': { fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: '13px', padding: '14px 0', caretColor: '#dfe1e5' },
  '.cm-scroller': { overflow: 'auto', fontFamily: '"JetBrains Mono", Consolas, monospace', lineHeight: '1.75' },
  '.cm-gutters': { background: 'var(--color-background)', color: '#6f737a', borderRight: '1px solid var(--color-surface-raised)', paddingRight: '6px' },
  '.cm-activeLine, .cm-activeLineGutter': { background: 'var(--color-surface)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#dfe1e5' },
  '.cm-selectionBackground': { backgroundColor: '#35465c' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#365d85' },
  '.cm-content ::selection': { backgroundColor: '#365d85', color: '#ffffff' },
  '.cm-tooltip': { background: 'var(--color-surface-raised)', color: '#dfe1e5', border: '1px solid var(--color-border-strong)', borderRadius: '6px' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { background: 'var(--color-primary)', color: 'var(--color-on-primary)' },
  '.cm-completionDetail': { color: '#9da0a8', fontSize: '11px' },
  '.cm-search': { background: 'var(--color-surface-raised)', fontSize: '12px' },
  '.cm-panels': { background: 'var(--color-surface-raised)', color: '#dfe1e5' },
  '.cm-completionInfo': { whiteSpace: 'pre-wrap', maxWidth: '320px', fontSize: '12px', lineHeight: '1.5' },
}, { dark: true });

const foldCache = new WeakMap();
const folds = foldService.of((state, from, to) => {
  let ranges = foldCache.get(state.doc);
  if (!ranges) {
    ranges = new Map(); const stack = []; let offset = 0;
    for (const token of tokenize(state.doc.toString())) {
      if (token.type === 'punct' && token.value === '{') stack.push(offset);
      if (token.type === 'punct' && token.value === '}' && stack.length) {
        const start = stack.pop(), line = state.doc.lineAt(start);
        if (offset > line.to) ranges.set(line.from, { from: start + 1, to: offset });
      }
      offset += token.value.length;
    }
    foldCache.set(state.doc, ranges);
  }
  return ranges.get(from) || null;
});

export default function Editor({ code, documentId, onChange, filename, onOpen, onSave, onRun, onStatus, inputRef, diagnostics = [], paused, busy, onDebugCommand, onBreakpoints }) {
  const readonly = useRef(new Compartment());
  const host = useRef(), viewRef = useRef(), states = useRef(new Map()), activeId = useRef(documentId), syncing = useRef(false);
  const callbacks = useRef(); callbacks.current = { onChange, onOpen, onRun, onStatus, onBreakpoints };
  const reportStatus = view => {
    const position = view.state.selection.main.head, line = view.state.doc.lineAt(position);
    callbacks.current.onStatus?.({ line: line.number, column: position - line.from + 1, canUndo: undoDepth(view.state) > 0, canRedo: redoDepth(view.state) > 0 });
  };
  const extensions = () => [EditorState.phrases.of({
    'Find': 'Buscar', 'Replace': 'Substituir', 'next': 'próximo', 'previous': 'anterior', 'all': 'todos',
    'match case': 'diferenciar maiúsculas', 'regexp': 'expressão regular', 'by word': 'palavra inteira',
    'replace': 'substituir', 'replace all': 'substituir tudo', 'close': 'fechar', 'Go to line': 'Ir para a linha', 'go': 'ir',
    'Completions': 'Sugestões', 'folded code': 'código recolhido', 'unfold': 'expandir',
    'Fold line': 'Recolher linha', 'Unfold line': 'Expandir linha', 'Folded lines': 'Linhas recolhidas', 'Unfolded lines': 'Linhas expandidas',
    'to': 'até', 'current match': 'ocorrência atual', 'on line': 'na linha', 'replaced $ matches': '$ ocorrências substituídas',
    'replaced match on line $': 'ocorrência substituída na linha $',
  }), basicSetup, debugExtensions, readonly.current.of(EditorState.readOnly.of(false)), portugolLanguage, portugolHighlight, indentUnit.of('    '), EditorState.tabSize.of(4), folds, theme, lintGutter(),
    autocompletion({ override: [portugolCompletions], defaultKeymap: true }),
    hoverTooltip(portugolHover, { hoverTime: 250 }),
    Prec.highest(keymap.of([{ key: 'Tab', run: acceptCompletion }, indentWithTab, { key: 'Mod-Shift-z', run: redo, preventDefault: true }, { key: 'Mod-Enter', run: () => { callbacks.current.onRun?.(); return true; } }])),
    EditorView.contentAttributes.of({ 'aria-label': 'Código Portugol', 'aria-multiline': 'true', role: 'textbox', spellcheck: 'false' }),
    EditorView.updateListener.of(update => {
      states.current.set(activeId.current, update.state);
      callbacks.current.onBreakpoints?.(breakpointLines(update.state));
      if (update.docChanged && !syncing.current) callbacks.current.onChange(update.state.doc.toString());
      if (update.docChanged || update.selectionSet) reportStatus(update.view);
    }),
  ];
  useEffect(() => {
    const view = new EditorView({ parent: host.current, state: EditorState.create({ doc: code, extensions: extensions() }) });
    viewRef.current = view;
    inputRef.current = {
      focus: () => view.focus(),
      breakpoints: () => breakpointLines(view.state),
      fix: fix => { if (view.state.readOnly || fix.source !== view.state.doc.toString()) return; view.dispatch({ changes: fix.changes, userEvent: 'input' }); view.focus(); },
      navigate: position => { const anchor = Math.min(position, view.state.doc.length); view.focus(); view.dispatch({ selection: { anchor }, effects: EditorView.scrollIntoView(anchor, { y: 'center' }) }); },
      select: () => { view.focus(); view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } }); },
      undo: () => { view.focus(); return undo(view); }, redo: () => { view.focus(); return redo(view); }, complete: () => startCompletion(view),
    };
    reportStatus(view);
    return () => { view.destroy(); viewRef.current = null; inputRef.current = null; };
  }, []);
  useEffect(() => {
    const view = viewRef.current; if (!view) return;
    if (activeId.current !== documentId) {
      states.current.set(activeId.current, view.state); activeId.current = documentId;
      view.setState(states.current.get(documentId) || EditorState.create({ doc: code, extensions: extensions() }));
      reportStatus(view);
    }
    if (view.state.doc.toString() !== code) {
      syncing.current = true;
      try { view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code }, selection: { anchor: Math.min(view.state.selection.main.head, code.length) }, annotations: Transaction.addToHistory.of(false) }); }
      finally { syncing.current = false; }
    }
    requestAnimationFrame(() => view.requestMeasure());
  }, [code, documentId]);
  useEffect(() => {
    const view = viewRef.current;
    if (view) view.dispatch(setDiagnostics(view.state, diagnostics.map(item => ({ ...item, renderMessage: () => diagnosticMessage(item, fix => inputRef.current?.fix(fix), busy) }))));
  }, [diagnostics, code, documentId, busy]);
  useEffect(() => { const view = viewRef.current; if (view) view.dispatch({ effects: [readonly.current.reconfigure(EditorState.readOnly.of(!!busy)), executionPosition.of(paused?.from ?? null), ...(paused ? [EditorView.scrollIntoView(paused.from, { y: 'center' })] : [])] }); }, [busy, paused, documentId]);
  return <section className="editor-panel" onDragOver={event => { if (event.dataTransfer.types.includes('Files')) event.preventDefault(); }} onDrop={event => { if (event.dataTransfer.files[0]) { event.preventDefault(); onOpen(event.dataTransfer.files[0]); } }}>
    <div className="editor-heading"><span className="truncate">{filename}</span><div className="flex items-center gap-2"><button className="editor-assist" onClick={() => { viewRef.current.focus(); startCompletion(viewRef.current); }} title="Completar código (Ctrl + Espaço)"><Sparkles size={13}/><span>Completar</span></button><button onClick={onSave} title="Salvar (Ctrl + S)"><Save size={13}/><span className="desktop-label">Salvar</span></button></div></div>
    {busy && <div className="debug-toolbar" role="toolbar" aria-label="Depuração">
      <button aria-label={paused ? 'Continuar' : 'Pausar'} title={paused ? 'Continuar execução' : 'Pausar execução'} onClick={() => onDebugCommand(paused ? 'continue' : 'pause')}>{paused ? <Play size={16} aria-hidden="true"/> : <Pause size={16} aria-hidden="true"/>}</button>
      <button aria-label="Entrar" title="Entrar na função · executar próximo comando" disabled={!paused} onClick={() => onDebugCommand('into')}><ArrowDownToLine size={16} aria-hidden="true"/></button>
      <button aria-label="Avançar" title="Avançar · executar chamada inteira sem entrar na função" disabled={!paused} onClick={() => onDebugCommand('over')}><CornerDownRight size={16} aria-hidden="true"/></button>
      <button aria-label="Sair da função" title="Sair da função · continuar até retornar à chamada" disabled={!paused} onClick={() => onDebugCommand('out')}><ArrowUpFromLine size={16} aria-hidden="true"/></button>
      <span className="debug-toolbar-divider" aria-hidden="true"/>
      <button className="debug-stop" aria-label="Parar" title="Parar execução" onClick={() => onDebugCommand('stop')}><Square size={15} aria-hidden="true"/></button>
      <small>{paused ? `Pausado · linha ${paused.line}` : 'Em execução'}</small>
    </div>}
    <div ref={host} className="codemirror-host"/>
    <div className="editor-footer"><span>Portugol</span><span>{code.split('\n').length} linhas · UTF-8 · 4 espaços</span></div>
  </section>;
}
