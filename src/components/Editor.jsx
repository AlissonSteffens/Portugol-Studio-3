import { useEffect, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { EditorState, Transaction, Prec } from '@codemirror/state';
import { EditorView, keymap, hoverTooltip } from '@codemirror/view';
import { indentUnit, foldService } from '@codemirror/language';
import { indentWithTab, undo, redo, undoDepth, redoDepth } from '@codemirror/commands';
import { autocompletion, acceptCompletion, startCompletion } from '@codemirror/autocomplete';
import { portugolLanguage, portugolHighlight, portugolCompletions, portugolHover } from '../editor/portugol.js';
import { tokenize } from '../../js/transpiler.js';
import { Save, Sparkles } from 'lucide-react';

const theme = EditorView.theme({
  '&': { height: '100%', color: '#bcbec4', backgroundColor: '#1e1f22' },
  '.cm-content': { fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: '13px', padding: '14px 0', caretColor: '#dfe1e5' },
  '.cm-scroller': { overflow: 'auto', fontFamily: '"JetBrains Mono", Consolas, monospace', lineHeight: '1.75' },
  '.cm-gutters': { background: '#1e1f22', color: '#6f737a', borderRight: '1px solid #2b2d30', paddingRight: '6px' },
  '.cm-activeLine, .cm-activeLineGutter': { background: '#26282d' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#dfe1e5' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { background: '#214283 !important' },
  '.cm-tooltip': { background: '#2b2d30', color: '#dfe1e5', border: '1px solid #43454a', borderRadius: '6px' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { background: '#214283', color: '#fff' },
  '.cm-completionDetail': { color: '#9da0a8', fontSize: '11px' },
  '.cm-search': { background: '#2b2d30', fontSize: '12px' },
  '.cm-panels': { background: '#2b2d30', color: '#dfe1e5' },
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

export default function Editor({ code, documentId, onChange, filename, onOpen, onSave, onRun, onStatus, inputRef }) {
  const host = useRef(), viewRef = useRef(), states = useRef(new Map()), activeId = useRef(documentId), syncing = useRef(false);
  const callbacks = useRef(); callbacks.current = { onChange, onOpen, onRun, onStatus };
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
  }), basicSetup, portugolLanguage, portugolHighlight, indentUnit.of('    '), EditorState.tabSize.of(4), folds, theme,
    autocompletion({ override: [portugolCompletions], defaultKeymap: true }),
    hoverTooltip(portugolHover, { hoverTime: 250 }),
    Prec.highest(keymap.of([{ key: 'Tab', run: acceptCompletion }, indentWithTab, { key: 'Mod-Shift-z', run: redo, preventDefault: true }, { key: 'Mod-Enter', run: () => { callbacks.current.onRun?.(); return true; } }])),
    EditorView.contentAttributes.of({ 'aria-label': 'Código Portugol', 'aria-multiline': 'true', role: 'textbox', spellcheck: 'false' }),
    EditorView.updateListener.of(update => {
      states.current.set(activeId.current, update.state);
      if (update.docChanged && !syncing.current) callbacks.current.onChange(update.state.doc.toString());
      if (update.docChanged || update.selectionSet) reportStatus(update.view);
    }),
  ];
  useEffect(() => {
    const view = new EditorView({ parent: host.current, state: EditorState.create({ doc: code, extensions: extensions() }) });
    viewRef.current = view;
    inputRef.current = {
      focus: () => view.focus(),
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
  return <section className="editor-panel" onDragOver={event => { if (event.dataTransfer.types.includes('Files')) event.preventDefault(); }} onDrop={event => { if (event.dataTransfer.files[0]) { event.preventDefault(); onOpen(event.dataTransfer.files[0]); } }}>
    <div className="editor-heading"><span className="truncate">{filename}</span><div className="flex items-center gap-2"><button className="editor-assist" onClick={() => { viewRef.current.focus(); startCompletion(viewRef.current); }} title="Completar código (Ctrl + Espaço)"><Sparkles size={13}/><span>Completar</span></button><button onClick={onSave} title="Salvar (Ctrl + S)"><Save size={13}/><span className="desktop-label">Salvar</span></button></div></div>
    <div ref={host} className="codemirror-host"/>
    <div className="editor-footer"><span>Portugol</span><span>{code.split('\n').length} linhas · UTF-8 · 4 espaços</span></div>
  </section>;
}
