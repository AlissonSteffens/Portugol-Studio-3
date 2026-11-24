import { serializeStudioDocument } from './services/studio-metadata.js';
import { ExecutionDebugger } from '../../core/execution/debugger.js';
import CodeInspector from './components/CodeInspector.jsx';
import { analyzeCode } from './services/analysis.js';
import { assetUrl } from './services/assets.js';
import useStoredState from './hooks/useStoredState.js';
import useRecentExamples from './hooks/useRecentExamples.js';
import ResizeHandle from './components/ResizeHandle.jsx';
import { Bug, Play, Square, Home, Code2, TerminalSquare, ListTree, X, BookOpen, PanelLeft } from 'lucide-react';
import ExamplesMenu from './components/ExamplesMenu.jsx';
import useDocuments from './hooks/useDocuments.js';
import Welcome from './components/Welcome.jsx';
import VolumeControl, { readVolume } from './components/VolumeControl.jsx';
import MenuBar from './components/MenuBar.jsx';
import FileDialog from './components/FileDialog.jsx';
import TabContextMenu from './components/TabContextMenu.jsx';
import { canChooseSaveLocation, saveFile } from './services/save-file.js';
import ExportDialog from './components/ExportDialog.jsx';
import { loadCatalog, loadExample, decodeSource } from './services/examples.js';
import { transpilePortugol, PortugolRuntime } from '../../runtime/index.js';
import { useCallback, useEffect, useRef, useState, useMemo, lazy, Suspense } from 'react';
const Editor = lazy(() => import('./components/Editor.jsx'));
import Terminal from './components/Terminal.jsx';
import Graphics from './components/Graphics.jsx';
import { detectInputProfile } from '../../runtime/input/profile.js';
import FileRepository from './components/FileRepository.jsx';
import { createRuntimeFiles, repository } from './services/repository.js';
const EMPTY_FILES = {};
const desktop = typeof window !== 'undefined' ? window.portugolDesktop : undefined;
// Injected by vite.config.js from package.json.
const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
// Same breakpoint as the stylesheet: phones and tablets run graphics inline, full screen.
const compactQuery = '(max-width: 760px), (max-width: 1024px) and (pointer: coarse)';
const isCompact = () => typeof matchMedia === 'function' && matchMedia(compactQuery).matches;
const usesGraphics = source => /\binclua\s+biblioteca\s+Graficos\b/.test(source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ''));
const starter = 'programa\n{\n    funcao inicio()\n    {\n        escreva("Olá, mundo!\\n")\n    }\n}\n';
export default function App() {
  const [audioSettings, setAudioSettings] = useState(readVolume);
  const [exporting, setExporting] = useState(false);
  const audioRef = useRef(audioSettings);
  const [examples, setExamples] = useState([]), [loadingExample, setLoadingExample] = useState(false);
  const exampleRequest = useRef(0);
  const store = useDocuments(starter);
  const recentExamples = useRecentExamples();
  const { code, filename, exampleId: selected } = store.active;
  const localFiles = store.active.localFiles || EMPTY_FILES;
  const activeExample = examples.find(example => example.id === selected);
  const setCode = code => store.update({ code });
  const analysis = useMemo(() => analyzeCode(code), [code]);
  const inputProfile = useMemo(() => detectInputProfile(code), [code]);
  const [runtimeDiagnostic, setRuntimeDiagnostic] = useState(null);
  const diagnostics = useMemo(() => [...analysis.diagnostics, ...(runtimeDiagnostic ? [runtimeDiagnostic] : [])], [analysis, runtimeDiagnostic]);
  const [paused, setPaused] = useState(null);
  const [executionDetached, setExecutionDetached] = useState(false);
  const [values, setValues] = useState({});
  const inspection = useRef({}), inspectionFrame = useRef(null);
  const publishInspection = () => {
    const formatted = {};
    for (const [key, value] of Object.entries(inspection.current)) {
      try { formatted[key] = typeof value === 'boolean' ? (value ? 'verdadeiro' : 'falso') : JSON.stringify(value); } catch { formatted[key] = String(value); }
    }
    setValues(formatted);
  };
  useEffect(() => { setValues({}); setRuntimeDiagnostic(null); inspection.current = {}; }, [code, store.active.id]);
  useEffect(() => () => cancelAnimationFrame(inspectionFrame.current), []);

  const [home, setHome] = useStoredState('home', true, value => typeof value === 'boolean');
  const [dialog, setDialog] = useState(null);
  const [tabMenu, setTabMenu] = useState(null), [closeQueue, setCloseQueue] = useState([]);
  // The editor screen has one side panel with three tools; it can be hidden without losing the tool.
  const [sideTab, setSideTab] = useStoredState('side-panel-tab', 'messages', value => ['messages', 'symbols', 'resources'].includes(value));
  const [sideOpen, setSideOpen] = useStoredState('side-panel-open', true, value => typeof value === 'boolean');
  const sidePanel = sideOpen ? sideTab : null;
  const setSidePanel = tab => { if (tab) { setSideTab(tab); setSideOpen(true); } else setSideOpen(false); };
  const [graphicsTarget, setGraphicsTarget] = useStoredState('graphics-target', 'janela', value => ['janela', 'painel'].includes(value));
  const graphicsControl = useRef();
  const place = desktop ? 'janela' : 'aba';
  const [homeSection, setHomeSection] = useStoredState('home-section', 'examples', value => ['examples', 'help'].includes(value));
  const [mobileTab, setMobileTab] = useStoredState('mobile-tab', 'editor', value => ['editor', 'recursos', 'execucao'].includes(value));
  const [editorInfo, setEditorInfo] = useState({ line: 1, column: 1, canUndo: false, canRedo: false });
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('Pronto');
  const [error, setError] = useState(''), [entries, setEntries] = useState([]), [view, setView] = useStoredState('output-view-compact', 'closed', value => ['ambos', 'grafico', 'terminal', 'closed'].includes(value));
  const [repositoryWidth, setRepositoryWidth] = useStoredState('side-panel-width', 300, value => Number.isFinite(value) && value >= 220 && value <= 480);
  const [outputRatio, setOutputRatio] = useStoredState('output-ratio', .3, value => Number.isFinite(value) && value >= .2 && value <= .65);
  const [graphicsRatio, setGraphicsRatio] = useStoredState('graphics-ratio', .5, value => Number.isFinite(value) && value >= .2 && value <= .8);
  const workspaceRef = useRef(), outputRef = useRef();
  const collapsePanel = panel => { if (view !== 'ambos') setMobileTab('editor'); setView(current => current === 'ambos' ? (panel === 'grafico' ? 'terminal' : 'grafico') : 'closed'); };
  const resizeOutput = event => { const rect = workspaceRef.current.getBoundingClientRect(); return (rect.bottom - event.clientY) / rect.height; };
  const resizeGraphics = event => { const rect = outputRef.current.getBoundingClientRect(); return (event.clientX - rect.left) / rect.width; };
  const showSidebar = tab => { setHome(false); setSidePanel(tab); setMobileTab('recursos'); };
  const toggleSidebar = tab => { if (!home && sidePanel === tab && !isCompact()) { setSidePanel(null); setMobileTab('editor'); } else showSidebar(tab); };
  const showHome = section => { setHomeSection(section); setHome(true); };
  const showEditor = () => { setHome(false); setMobileTab('editor'); requestAnimationFrame(() => editorRef.current?.focus()); };
  const [js, setJs] = useState(null), [title, setTitle] = useState('Modo gráfico'), [resolution, setResolution] = useState('800 × 600');
  const editorRef = useRef(), runtimeRef = useRef(), terminalRef = useRef(), fileInput = useRef(), running = useRef(false), cancel = useRef(false);
  function changeVolume(settings) {
    audioRef.current = settings; setAudioSettings(settings);
    runtimeRef.current?.setMasterVolume(settings.muted ? 0 : settings.volume);
  }
  const [canvas] = useState(() => { const node = document.createElement('canvas'); node.width = 800; node.height = 600; node.tabIndex = 0; node.setAttribute('aria-label', 'Tela gráfica Portugol'); return node; });
  const outputDocument = useRef(store.active.id);
  useEffect(() => {
    if (outputDocument.current === store.active.id) return;
    outputDocument.current = store.active.id;
    canvas.width = 800; canvas.height = 600;
    terminalRef.current?.replaceChildren();
    setTitle('Modo gráfico'); setResolution('800 × 600');
    setStatus('Pronto'); setError(''); setJs(null);
    setExecutionDetached(false); setView('closed'); setMobileTab('editor');
  }, [store.active.id, canvas]);
  const report = useCallback(error => { console.error(error); setError(error.message); }, []);
  const refresh = useCallback(async () => setEntries(await repository.list()), []);
  useEffect(() => { refresh().catch(report); loadCatalog().then(setExamples).catch(report); return () => runtimeRef.current?.destroy(); }, [refresh, report]);
  async function selectExample(id) {
    const request = ++exampleRequest.current;
    if (busy) return;
    const example = examples.find(example => example.id === id);
    if (!example) { setLoadingExample(false); return; }
    setLoadingExample(true);
    try {
      const source = await loadExample(example);
      if (request === exampleRequest.current) { store.create({ code: source, filename: example.arquivo, exampleId: id }); recentExamples.remember(id); setHome(false); setMobileTab('editor'); }
    } catch (error) { if (request === exampleRequest.current) { report(error); } }
    finally { if (request === exampleRequest.current) setLoadingExample(false); }
  }
  async function open(file) {
    if (busy) return;
    try {
      if (!file.name.toLowerCase().endsWith('.por')) throw new Error('Selecione um arquivo .por para abrir no editor.');
      ++exampleRequest.current; setLoadingExample(false);
      const text = decodeSource(await file.arrayBuffer());
      store.create({ code: text.replaceAll('\r\n', '\n'), filename: file.name }); setHome(false); setMobileTab('editor');
    } catch (error) { report(error); }
  }
  async function save(document = store.active, name = document.filename) {
    try {
      const result = await saveFile(new Blob([serializeStudioDocument(document)], { type: 'text/plain;charset=utf-8' }), name, { source: true });
      if (!result) return false;
      store.update({ filename: result.name, savedCode: document.code }, document.id);
      setStatus(result.downloaded ? 'Download iniciado — destino definido pelo navegador' : 'Arquivo salvo');
      return true;
    } catch (error) { report(error); return false; }
  }
  function saveAs() {
    if (canChooseSaveLocation()) return save();
    setDialog({ kind: 'save', id: store.active.id, filename });
  }
  function openHelpExample(source, title) {
    if (busy || loadingExample || !store.ready) return;
    ++exampleRequest.current;
    const name = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').trim() || 'Exemplo da ajuda';
    store.create({ code: source.replaceAll('\r\n', '\n'), filename: name + '.por' });
    setHome(false); setMobileTab('editor'); setError('');
  }
  function newFile() { if (busy || loadingExample) return; ++exampleRequest.current; store.create(); setHome(false); setMobileTab('editor'); setError(''); }
  function continueDocument(id) {
    const document = store.documents.find(document => document.id === id);
    if (!document || busy || loadingExample) return;
    if (document.exampleId) recentExamples.remember(document.exampleId);
    store.activate(id); setHome(false); setMobileTab('editor');
  }
  function closeFile(document) {
    requestClose([document.id]);
  }
  function requestClose(ids) {
    if (busy || loadingExample || !store.ready || dialog || closeQueue.length) return;
    setCloseQueue(ids);
  }
  useEffect(() => {
    if (!closeQueue.length || dialog || busy || loadingExample || !store.ready) return;
    const document = store.documents.find(document => document.id === closeQueue[0]);
    if (!document) { setCloseQueue(current => current.slice(1)); return; }
    if (document.code !== document.savedCode || Object.keys(document.localFiles || {}).length) {
      setDialog({ kind: 'close', id: document.id, filename: document.filename, localResources: !!Object.keys(document.localFiles || {}).length });
    } else { store.close(document.id); setCloseQueue(current => current.slice(1)); }
  }, [closeQueue, dialog, busy, loadingExample, store.ready, store.documents]);
  function openTabMenu(event, document) {
    event.preventDefault();
    const opener = event.currentTarget.querySelector('[role=tab]'), rect = opener.getBoundingClientRect();
    setTabMenu({ id: document.id, filename: document.filename, opener, x: event.clientX || rect.left, y: event.clientY || rect.bottom });
  }
  async function submitDialog(value) {
    const document = store.documents.find(document => document.id === dialog.id);
    if (dialog.kind === 'close') { if (value && !await save(document)) return; store.close(document.id); setCloseQueue(current => current.filter(id => id !== document.id)); }
    else if (!await save(document, value)) return;
    setDialog(null);
  }
  function openPicker() { if (!busy && !loadingExample) fileInput.current.click(); }
  function clearOutput() { if (busy) return; terminalRef.current?.replaceChildren(); canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); }

  function stop() { cancel.current = true; runtimeRef.current?.abort(); }
  const run = useCallback(async (debugMode = false) => {
    debugMode = debugMode === true; setPaused(null);
    if (running.current || loadingExample || !store.ready) return;
    // Must happen synchronously in the click or key handler, or the browser blocks the new tab.
    const graphical = usesGraphics(code), hasErrors = analysis.diagnostics.some(item => item.severity === 'error');
    // A tab the user opened by hand keeps being used, even when the preference is the panel.
    const separate = graphical && !hasErrors && (graphicsTarget === 'janela' || !!graphicsControl.current?.isDetached()) && !isCompact() && !(debugMode && !desktop);
    if (separate) graphicsControl.current?.detach();
    else if (graphicsControl.current?.isDetached()) graphicsControl.current.restore();
    setHome(false); setMobileTab('execucao'); setView(separate ? 'grafico' : graphical && !isCompact() ? 'ambos' : 'terminal'); running.current = true; cancel.current = false; setBusy(true); setError(''); setStatus('Preparando');
    runtimeRef.current?.destroy(); runtimeRef.current = null; terminalRef.current.replaceChildren();
    let files, runtime;
    try {
      if (hasErrors) throw Object.assign(new Error('Corrija os erros indicados no painel de mensagens.'), { compilation: true });
      setValues({}); setRuntimeDiagnostic(null); inspection.current = {};
      const compiled = transpilePortugol(code, { inspect: true, debug: true });
      files = await createRuntimeFiles(refresh, report, examples.find(example => example.id === selected), localFiles);
      if (cancel.current) throw new Error('EXECUCAO_INTERROMPIDA');
      runtime = new PortugolRuntime(canvas, terminalRef.current, { files, inspectionInterval: 80, masterVolume: audioRef.current.muted ? 0 : audioRef.current.volume, onResize: (w, h) => setResolution(w + ' × ' + h), onTitleChange: setTitle });
      runtime.debugger = new ExecutionDebugger({ breakpoints: editorRef.current?.breakpoints(), lineAt: from => code.slice(0, from).split('\n').length, onPause: state => { runtime.__releaseMouseCapture?.(false); setPaused(state); publishInspection(); setStatus('Pausado'); setSidePanel('symbols'); setMobileTab('editor'); } });
      if (!debugMode) runtime.debugger.mode = 'continue';
      const globalSymbols = new Set(analysis.symbols.filter(item => item.kind === 'variable').map(item => item.from));
      runtime.inspect = (scope, from, symbols) => {
        runtime.debugger?.inspect(scope, from, symbols);
        runtime.sourcePosition = from;
        for (const symbol of symbols) {
          const owner = globalSymbols.has(symbol.from) ? 'programa' : scope;
          inspection.current[`${owner}:${symbol.from}`] = symbol.value;
        }
        if (!inspectionFrame.current) inspectionFrame.current = requestAnimationFrame(() => { inspectionFrame.current = null; publishInspection(); });
      };
      const readInput = runtime.leia.bind(runtime);
      runtime.leia = type => { if (isCompact()) setView('terminal'); else if (!graphicsControl.current?.isDetached()) setView(current => current === 'closed' || current === 'grafico' ? 'ambos' : current); return readInput(type); };
      const startGraphics = runtime.Graficos.iniciar_modo_grafico;
      runtime.Graficos.iniciar_modo_grafico = (...args) => {
        setView(current => graphicsControl.current?.isDetached() || isCompact() ? 'grafico' : current === 'terminal' || current === 'closed' ? 'ambos' : current); if (!graphicsControl.current?.isDetached()) setOutputRatio(current => Math.max(current, .55));
        requestAnimationFrame(() => canvas.focus({ preventScroll: true }));
        return startGraphics(...args);
      };
      runtimeRef.current = runtime; setStatus('Executando');
      await new Function('__runtime', compiled)(runtime);
      setStatus(cancel.current ? 'Interrompido' : 'Concluído');
    } catch (error) {
      if (error.message === 'EXECUCAO_INTERROMPIDA') setStatus('Interrompido');
      else { report(error); setStatus('Erro'); if (error.compilation) setView('closed'); setSidePanel('messages'); setMobileTab('recursos'); if (!error.compilation) { const from = error.from ?? runtime?.sourcePosition ?? 0; setRuntimeDiagnostic({ code: error.code || 'ErroExecucao.ErroExecucaoNaoTratado', from, to: error.to ?? Math.min(code.length, from + 1), severity: 'error', message: 'Execução: ' + error.message }); } }
    } finally {
      publishInspection();
      runtime?.destroy(); runtimeRef.current = null;
      try { await files?.flush(); await refresh(); } catch (error) { report(error); setStatus('Erro ao salvar arquivos'); }
      running.current = false; setBusy(false); setPaused(null);
    }
  }, [code, canvas, refresh, report, examples, selected, loadingExample, localFiles, store.ready, analysis, graphicsTarget]);
  useEffect(() => {
    const key = event => {
      if (dialog || exporting || tabMenu || event.defaultPrevented) return;
      if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); run(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); if (event.shiftKey) saveAs(); else save(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') { event.preventDefault(); openPicker(); }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'e') { event.preventDefault(); if (!busy && !loadingExample) setExporting(true); }
      if (event.altKey && event.key.toLowerCase() === 'n') { event.preventDefault(); newFile(); }
      if (event.key === 'Escape' && (canvas.ownerDocument.pointerLockElement === canvas || runtimeRef.current?.__ignoreEscapeUntil > performance.now())) return;
      if (event.key === 'Escape') { stop(); setJs(null); }
    };
    const unload = event => { if (store.documents.some(document => document.code !== document.savedCode || Object.keys(document.localFiles || {}).length)) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('keydown', key); window.addEventListener('beforeunload', unload);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('beforeunload', unload); };
  }, [run, dialog, exporting, tabMenu, code, filename, store.documents, busy, loadingExample, home]);
  function showJs() { try { setJs(transpilePortugol(code)); } catch (error) { report(error); } }
  const locked = busy || loadingExample || !store.ready;
  const tabMenuIndex = store.documents.findIndex(document => document.id === tabMenu?.id);
  const tabCloseItems = tabMenu ? [
    { label: 'Fechar aba', ids: [tabMenu.id] },
    { label: 'Fechar outras abas', ids: store.documents.filter(document => document.id !== tabMenu.id).map(document => document.id) },
    { label: 'Fechar abas à direita', ids: store.documents.slice(tabMenuIndex + 1).map(document => document.id) },
    { label: 'Fechar abas à esquerda', ids: store.documents.slice(0, tabMenuIndex).map(document => document.id) },
    { label: 'Fechar todas as abas', ids: store.documents.map(document => document.id) },
  ].map(item => ({ label: item.label, disabled: locked || !!closeQueue.length || !!dialog || tabMenuIndex < 0 || !item.ids.length, action: () => requestClose(item.ids) })) : [];
  const togglePanelItem = (id, label) => ({ label, checked: !home && sidePanel === id, action: () => toggleSidebar(id) });
  const exampleTree = () => {
    const root = new Map();
    for (const example of examples) {
      let level = root;
      for (const name of example.categoria.split(' / ')) { if (!level.has(name)) level.set(name, new Map()); level = level.get(name); }
      level.set('example:' + example.id, example);
    }
    const items = level => [...level].map(([key, value]) => value instanceof Map ? { label: key, items: items(value) } : { label: value.nome, action: () => selectExample(value.id), disabled: locked });
    return items(root);
  };
  const menus = [
    { label: 'Arquivo', items: [
      { label: 'Novo arquivo', shortcut: 'Alt + N', action: newFile, disabled: locked },
      { label: 'Abrir arquivo…', shortcut: 'Ctrl + O', action: openPicker, disabled: locked },
      { separator: true },
      { label: 'Salvar', shortcut: 'Ctrl + S', action: () => save() },
      { label: 'Salvar como…', shortcut: 'Ctrl + Shift + S', action: saveAs },
      { label: 'Exportar projeto…', shortcut: 'Ctrl + Shift + E', action: () => setExporting(true), disabled: locked },
      { separator: true },
      { label: 'Fechar arquivo', action: () => closeFile(store.active), disabled: locked },
      { label: 'Tela inicial', action: () => showHome('examples') },
    ] },
    { label: 'Editar', items: [
      { label: 'Desfazer', shortcut: 'Ctrl + Z', action: () => editorRef.current?.undo(), disabled: !editorInfo.canUndo },
      { label: 'Refazer', shortcut: 'Ctrl + Shift + Z', action: () => editorRef.current?.redo(), disabled: !editorInfo.canRedo },
      { separator: true },
      ...(desktop ? [{ role: 'cut', label: 'Recortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Colar' }, { separator: true }] : []),
      { label: 'Selecionar código', action: () => { setHome(false); requestAnimationFrame(() => editorRef.current?.select()); } },
      { label: 'Completar código', shortcut: 'Ctrl + Espaço', action: () => { setHome(false); setMobileTab('editor'); requestAnimationFrame(() => { editorRef.current?.focus(); editorRef.current?.complete(); }); } },
      { label: 'Copiar código', action: () => navigator.clipboard.writeText(code).catch(report) },
    ] },
    { label: 'Exemplos', render: close => <ExamplesMenu examples={examples} disabled={locked} onSelect={id => { close(); selectExample(id); }}/>,
      native: [{ label: 'Explorar exemplos…', action: () => showHome('examples') }, { separator: true }, ...exampleTree()] },
    { label: 'Executar', items: [
      { label: 'Executar programa', shortcut: 'Ctrl + Enter', action: () => run(), disabled: locked },
      { label: 'Depurar programa', action: () => run(true), disabled: locked },
      { label: 'Parar execução', shortcut: 'Esc', action: stop, disabled: !busy },
      { separator: true },
      { label: 'Limpar saída', action: clearOutput, disabled: busy },
      { label: 'Ver JavaScript transpilado', action: showJs },
    ] },
    { label: 'Exibir', items: [
      { label: 'Tela inicial e exemplos', action: () => showHome('examples') },
      { label: 'Editor', action: showEditor },
      { separator: true },
      togglePanelItem('symbols', 'Estrutura do programa'),
      togglePanelItem('messages', 'Problemas'),
      togglePanelItem('resources', 'Recursos'),
      { label: 'Painel do programa', checked: sideOpen, action: () => { setHome(false); setSideOpen(open => !open); } },
      { separator: true },
      { label: 'Terminal', checked: view === 'terminal' || view === 'ambos', action: () => { setHome(false); setMobileTab('execucao'); setView(current => current === 'ambos' ? 'grafico' : current === 'terminal' ? 'closed' : current === 'grafico' ? 'ambos' : 'terminal'); } },
      { label: 'Gráfico no painel', checked: view === 'grafico' || view === 'ambos', action: () => { setHome(false); setMobileTab('execucao'); setView(current => current === 'ambos' ? 'terminal' : current === 'grafico' ? 'closed' : current === 'terminal' ? 'ambos' : 'grafico'); } },
      { label: `Programas gráficos em ${place} separada`, checked: graphicsTarget === 'janela', action: () => setGraphicsTarget(current => current === 'janela' ? 'painel' : 'janela') },
      { separator: true },
      { label: 'Restaurar layout padrão', action: () => { setSideTab('messages'); setSideOpen(true); setRepositoryWidth(300); setOutputRatio(.3); setGraphicsRatio(.5); setView('closed'); setMobileTab('editor'); setHome(false); } },
    ] },
    { label: 'Ajuda', items: [
      { label: 'Ajuda do Portugol', action: () => showHome('help') },
      { label: 'Exemplos', action: () => showHome('examples') },
      { separator: true },
      { label: 'Site do Portugol Studio', action: () => window.open(desktop ? 'https://alissonsteffens.github.io/Portugol-Studio-3/' : assetUrl(''), '_blank', 'noopener') },
      ...(desktop?.checkForUpdates ? [{ label: 'Verificar atualizações…', action: () => desktop.checkForUpdates() }] : []),
      { separator: true },
      { label: `Portugol Studio ${APP_VERSION}`, disabled: true },
    ] },
  ];
  // On the desktop app the same menus become the window's native menu.
  const menuActions = useRef(new Map()), sentMenu = useRef('');
  const nativeActions = new Map();
  const nativeItems = (items, prefix) => items.map((item, index) => {
    if (item.separator) return { separator: true };
    if (item.role) return { role: item.role, label: item.label };
    if (item.items) return { label: item.label, items: nativeItems(item.items, prefix + index + '.') };
    const id = prefix + index; nativeActions.set(id, item.action);
    return { id, label: item.label, shortcut: item.shortcut, disabled: !!item.disabled, checked: item.checked };
  });
  const nativeMenu = desktop ? menus.map((menu, index) => ({ label: menu.label, items: nativeItems(menu.native || menu.items, index + '.') })) : null;
  menuActions.current = nativeActions;
  useEffect(() => {
    if (!desktop) return;
    const serialized = JSON.stringify(nativeMenu);
    if (serialized !== sentMenu.current) { sentMenu.current = serialized; desktop.setMenu(nativeMenu); }
  });
  useEffect(() => desktop?.onMenuCommand(id => menuActions.current.get(id)?.()), []);

  const errorCount = diagnostics.filter(item => item.severity === 'error').length;
  const runControls = <div className="run-controls" role="toolbar" aria-label="Execução">
    <button className="run-primary" aria-label="Executar programa" title="Executar programa (Ctrl + Enter)" disabled={locked} onClick={() => run()}><Play size={15} aria-hidden="true"/><span>Executar</span></button>
    <button className="run-debug" aria-label="Depurar" title="Depurar passo a passo · clique na margem do editor para marcar pontos de parada" disabled={locked} onClick={() => run(true)}><Bug size={16} aria-hidden="true"/></button>
    <button className="run-stop" aria-label="Parar execução" title="Parar execução (Esc)" disabled={!busy} onClick={stop}><Square size={14} aria-hidden="true"/></button>
  </div>;
  // The left bar switches screens only; the editor's own tools live in its side panel.
  const screens = [
    { label: 'Tela inicial', text: 'Início', title: 'Início e exemplos', icon: Home, pressed: home && homeSection === 'examples', action: () => showHome('examples') },
    { label: 'Mostrar editor', text: 'Editor', title: 'Editor de código', icon: Code2, pressed: !home, action: showEditor, badge: diagnostics.length },
    { label: 'Abrir ajuda', text: 'Ajuda', title: 'Ajuda do Portugol', icon: BookOpen, pressed: home && homeSection === 'help', action: () => showHome('help') },
  ];
  const sideRef = useRef();
  return <div className="ide-shell" data-desktop={!!desktop} data-mobile-playing={!home && busy && !paused && mobileTab === 'execucao' && view === 'grafico'}>
    {!desktop && <header className="ide-toolbar">
      <button className="ide-brand" onClick={() => showHome('examples')} title="Tela inicial"><img className="brand-logo" src={assetUrl('portugol-logo.png')} alt="" width="24" height="24"/><span>Portugol Studio</span></button>
      <MenuBar menus={menus}/>
      {runControls}
    </header>}
    <input ref={fileInput} type="file" accept=".por" hidden onChange={event => { if (event.target.files[0]) open(event.target.files[0]); event.target.value = ''; }}/>
    {exporting && <ExportDialog project={{ code, filename, example: activeExample, entries, localFiles, volume: audioSettings.muted ? 0 : audioSettings.volume }} onClose={() => setExporting(false)}/>}
    <div className="ide-body">
      <nav className="activity-bar" aria-label="Telas">
        {screens.map(item => <button key={item.label} aria-label={item.label} title={item.title} aria-pressed={item.pressed} onClick={item.action}><item.icon size={20} aria-hidden="true"/><span className="activity-text" aria-hidden="true">{item.text}</span>{item.badge > 0 && <span className={'activity-badge' + (errorCount ? ' has-errors' : '')}>{item.badge}</span>}</button>)}
      </nav>
      <div className="ide-main">
        {home && <Welcome section={homeSection} onSectionChange={setHomeSection} examples={examples} documents={store.documents} onNew={newFile} onOpen={openPicker} onExample={selectExample} onHelpExample={openHelpExample} onContinue={continueDocument} recentExampleIds={recentExamples.ids} onClearRecentExamples={recentExamples.clear} loading={locked}/>}
        {(error || store.storageError) && <div role="alert" className="ide-alert"><span>{error || store.storageError}</span><button aria-label="Fechar aviso" onClick={() => setError('')}><X size={14}/></button></div>}
        {!home && <nav className="mobile-tools" aria-label="Área de trabalho">{[{ id: 'editor', label: 'Editor', icon: Code2 }, { id: 'recursos', label: 'Ferramentas', icon: ListTree }, { id: 'execucao', label: 'Execução', icon: TerminalSquare }].map(tool => <button key={tool.id} aria-pressed={mobileTab === tool.id} onClick={() => { setMobileTab(tool.id); if (tool.id === 'recursos') setSideOpen(true); if (tool.id === 'execucao') setView(current => current === 'closed' ? 'terminal' : current); }}><tool.icon size={15}/>{tool.label}</button>)}</nav>}
        <div className={(home ? 'hidden ' : '') + 'ide-workspace'} data-mobile-tab={mobileTab} data-side={sidePanel ? 'open' : 'closed'} style={{ '--side-width': repositoryWidth + 'px' }}>
          {sidePanel && <>
            <div ref={sideRef} className="side-panel"><CodeInspector key={store.active.id} tab={sidePanel} onTabChange={showSidebar} onCollapse={() => { setSidePanel(null); setMobileTab('editor'); }} paused={paused} onFix={fix => editorRef.current?.fix(fix)} code={code} diagnostics={diagnostics} symbols={analysis.symbols} values={values} busy={busy} onNavigate={position => { setMobileTab('editor'); editorRef.current?.navigate(position); }} resources={<FileRepository key={store.active.id} code={code} example={activeExample} localFiles={localFiles} onLocalFilesChange={localFiles => store.update({ localFiles })} entries={entries} refresh={refresh} busy={busy || !store.ready} onError={report}/>}/></div>
            <ResizeHandle label="Largura da lateral" className="sidebar-resizer" value={repositoryWidth} onChange={setRepositoryWidth} min={220} max={480} getValue={event => event.clientX - sideRef.current.getBoundingClientRect().left}/>
          </>}
          <main ref={workspaceRef} className="workspace-center" data-output={view === 'closed' ? 'closed' : executionDetached && view === 'grafico' ? 'compact' : 'open'} style={{ '--editor-weight': (1 - outputRatio) + 'fr', '--output-weight': outputRatio + 'fr' }}>
            <div className="workspace-editor">
              <div className="editor-tabs-row">
                <button className="side-toggle" aria-label="Painel do programa" title={(sideOpen ? 'Ocultar' : 'Mostrar') + ' estrutura, problemas e recursos'} aria-pressed={sideOpen} onClick={() => setSideOpen(open => !open)}><PanelLeft size={16} aria-hidden="true"/></button>
                <div role="tablist" aria-label="Arquivos abertos" className="file-tabs">{store.documents.map(document => <div key={document.id} onMouseDown={event => { if (event.button === 1) event.preventDefault(); }} onAuxClick={event => { if (event.button === 1) { event.preventDefault(); closeFile(document); } }} onContextMenu={event => openTabMenu(event, document)} onKeyDown={event => { if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) openTabMenu(event, document); }} className={'file-tab ' + (store.active.id === document.id ? 'is-active' : '')}><button role="tab" aria-selected={store.active.id === document.id} disabled={busy} className="file-tab-label" title={document.filename} onClick={() => continueDocument(document.id)}>{document.filename}{document.code !== document.savedCode || Object.keys(document.localFiles || {}).length ? ' •' : ''}</button><button aria-label={'Fechar ' + document.filename} disabled={locked} className="file-tab-close" onClick={() => closeFile(document)}><X size={12}/></button></div>)}</div>
                {desktop && runControls}
              </div>
              <Suspense fallback={<div className="p-6 text-sm text-slate-400">Carregando editor…</div>}><Editor onBreakpoints={lines => { if (runtimeRef.current?.debugger) runtimeRef.current.debugger.breakpoints = new Set(lines); }} busy={busy} paused={paused} onDebugCommand={command => { if (command === 'stop') stop(); else if (command === 'pause') runtimeRef.current?.debugger?.pause(); else { setPaused(null); setStatus('Executando'); runtimeRef.current?.debugger?.resume(command); } }} diagnostics={diagnostics} inputRef={editorRef} documentId={store.active.id} onRun={() => run()} onStatus={setEditorInfo} code={code} onChange={setCode} onOpen={open}/></Suspense>
            </div>
            {view !== 'closed' && <ResizeHandle label="Tamanho dos painéis de execução" className="output-resizer" orientation="horizontal" value={outputRatio} onChange={setOutputRatio} min={.15} max={.75} getValue={resizeOutput}/>}
            <div ref={outputRef} className={'workspace-output ' + (view === 'closed' ? 'hidden' : '')} style={{ '--graphics-weight': graphicsRatio + 'fr', '--terminal-weight': (1 - graphicsRatio) + 'fr' }} data-view={view}>
              <div className={'graphic-tool ' + (view === 'terminal' ? 'hidden' : '')}><Graphics controlRef={graphicsControl} place={place} paused={!!paused} inputProfile={inputProfile} inputEnabled={!paused && !home && mobileTab === 'execucao' && view !== 'terminal' && view !== 'closed'} controls={selected === 'jogos_corrida' ? (code.includes('// Controles: W ou seta acima') ? 'W / ↑ acelerar · A D / ← → virar · S / Espaço frear' : '↑ acelerar · ← → virar · Espaço frear') : undefined} key={store.active.id} terminalRef={terminalRef} status={status} busy={busy} onStop={stop} onDetachedChange={detached => { setExecutionDetached(detached); if (!detached) { setView('ambos'); setMobileTab('execucao'); } }} error={error} onWindowClosed={() => { if (running.current) stop(); }} onCollapse={() => collapsePanel('grafico')} canvas={canvas} runtimeRef={runtimeRef} title={title} resolution={resolution} onError={report}/></div>
              {view === 'ambos' && <ResizeHandle label="Divisão entre gráfico e terminal" className="panels-resizer" orientation="vertical" value={graphicsRatio} onChange={setGraphicsRatio} min={.2} max={.8} getValue={resizeGraphics}/>}
              <div className={'terminal-tool ' + (view === 'grafico' ? 'hidden' : '')}><Terminal place={place} detached={executionDetached} onFocusExecution={() => canvas.ownerDocument.defaultView.focus()} onCollapse={() => collapsePanel('terminal')} terminalRef={terminalRef} clear={() => terminalRef.current.replaceChildren()}/></div>
            </div>
          </main>
        </div>
      </div>
    </div>
    <footer className="ide-status"><span className={busy ? 'text-green-300' : ''}>● {status}</span><span className="status-hint">Ctrl + Espaço · Completar código</span><span>Lin {editorInfo.line}, Col {editorInfo.column}</span><span className="desktop-label">{code.split('\n').length} linhas · UTF-8</span><VolumeControl settings={audioSettings} onChange={changeVolume}/></footer>
    {tabMenu && <TabContextMenu menu={tabMenu} items={tabCloseItems} onClose={() => setTabMenu(null)}/>}
    {dialog && <FileDialog key={dialog.kind + dialog.id} dialog={dialog} onClose={() => { setDialog(null); setCloseQueue([]); }} onSubmit={submitDialog}/>}
    {js !== null && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={() => setJs(null)}><section role="dialog" aria-modal="true" aria-label="JavaScript transpilado" className="panel flex max-h-[85vh] w-full max-w-4xl flex-col" onClick={e => e.stopPropagation()}><div className="panel-heading"><span>JavaScript transpilado</span><button autoFocus onClick={() => setJs(null)}>Fechar ×</button></div><pre className="overflow-auto p-5 font-mono text-xs leading-6">{js}</pre></section></div>}
  </div>;
}
