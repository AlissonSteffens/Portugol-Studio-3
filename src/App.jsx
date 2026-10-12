import { ExecutionDebugger } from '../runtime/core/debugger.js';
import CodeInspector from './components/CodeInspector.jsx';
import { analyzeCode } from './services/analysis.js';
import { assetUrl } from './services/assets.js';
import useStoredState from './hooks/useStoredState.js';
import ResizeHandle from './components/ResizeHandle.jsx';
import { Footprints, Play, Square, FilePlus2, FolderOpen, Home, Code2, Files, TerminalSquare, PanelRight, ListTree, CircleAlert, Monitor, X, Save, SaveAll, Share2, BookOpen } from 'lucide-react';
import ExamplesMenu from './components/ExamplesMenu.jsx';
import useDocuments from './hooks/useDocuments.js';
import Welcome from './components/Welcome.jsx';
import VolumeControl, { readVolume } from './components/VolumeControl.jsx';
import MenuBar from './components/MenuBar.jsx';
import FileDialog from './components/FileDialog.jsx';
import ExportDialog from './components/ExportDialog.jsx';
import { loadCatalog, loadExample, decodeSource } from './services/examples.js';
import { transpilePortugol, PortugolRuntime } from '../runtime/index.js';
import { useCallback, useEffect, useRef, useState, useMemo, lazy, Suspense } from 'react';
const Editor = lazy(() => import('./components/Editor.jsx'));
import Terminal from './components/Terminal.jsx';
import Graphics from './components/Graphics.jsx';
import FileRepository from './components/FileRepository.jsx';
import { createRuntimeFiles, repository, download } from './services/repository.js';
const EMPTY_FILES = {};
const starter = 'programa\n{\n    funcao inicio()\n    {\n        escreva("Olá, mundo!\\n")\n    }\n}\n';
export default function App() {
  const [audioSettings, setAudioSettings] = useState(readVolume);
  const [exporting, setExporting] = useState(false);
  const audioRef = useRef(audioSettings);
  const [examples, setExamples] = useState([]), [loadingExample, setLoadingExample] = useState(false);
  const exampleRequest = useRef(0);
  const store = useDocuments(starter);
  const { code, filename, exampleId: selected } = store.active;
  const localFiles = store.active.localFiles || EMPTY_FILES;
  const activeExample = examples.find(example => example.id === selected);
  const setCode = code => store.update({ code });
  const analysis = useMemo(() => analyzeCode(code), [code]);
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
  const [showInspector, setShowInspector] = useStoredState('inspector-visible', true, value => typeof value === 'boolean');
  const [sidebarTab, setSidebarTab] = useStoredState('workspace-sidebar-tab', 'messages', value => ['messages', 'symbols', 'resources'].includes(value));
  const showRepository = showInspector && sidebarTab === 'resources';
  const setShowRepository = visible => { if (visible) { setShowInspector(true); setSidebarTab('resources'); } else setSidebarTab('messages'); };
  const [homeSection, setHomeSection] = useStoredState('home-section', 'examples', value => ['examples', 'help'].includes(value));
  const [mobileTab, setMobileTab] = useStoredState('mobile-tab', 'editor', value => ['editor', 'recursos', 'execucao'].includes(value));
  const [editorInfo, setEditorInfo] = useState({ line: 1, column: 1, canUndo: false, canRedo: false });
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('Pronto');
  const [error, setError] = useState(''), [entries, setEntries] = useState([]), [view, setView] = useStoredState('output-view-compact', 'closed', value => ['ambos', 'grafico', 'terminal', 'closed'].includes(value));
  const [repositoryWidth, setRepositoryWidth] = useStoredState('sidebar-width', 330, value => Number.isFinite(value) && value >= 280 && value <= 480);
  const [outputRatio, setOutputRatio] = useStoredState('output-ratio', .3, value => Number.isFinite(value) && value >= .2 && value <= .65);
  const [graphicsRatio, setGraphicsRatio] = useStoredState('graphics-ratio', .5, value => Number.isFinite(value) && value >= .2 && value <= .8);
  const workspaceRef = useRef(), outputRef = useRef();
  const stacked = true;
  const collapsePanel = panel => { if (view !== 'ambos') setMobileTab('editor'); setView(current => current === 'ambos' ? (panel === 'grafico' ? 'terminal' : 'grafico') : 'closed'); };
  const resizeOutput = event => { const rect = workspaceRef.current.getBoundingClientRect(); return (rect.bottom - event.clientY) / rect.height; };
  const resizeGraphics = event => { const rect = outputRef.current.getBoundingClientRect(); return (event.clientX - rect.left) / rect.width; };
  const showSidebar = tab => { setHome(false); setShowInspector(true); setSidebarTab(tab); setMobileTab('recursos'); };
  const [js, setJs] = useState(null), [title, setTitle] = useState('Modo gráfico'), [resolution, setResolution] = useState('800 × 600');
  const editorRef = useRef(), runtimeRef = useRef(), terminalRef = useRef(), fileInput = useRef(), running = useRef(false), cancel = useRef(false);
  function changeVolume(settings) {
    audioRef.current = settings; setAudioSettings(settings);
    runtimeRef.current?.setMasterVolume(settings.muted ? 0 : settings.volume);
  }
  const [canvas] = useState(() => { const node = document.createElement('canvas'); node.width = 800; node.height = 600; node.tabIndex = 0; node.setAttribute('aria-label', 'Tela gráfica Portugol'); return node; });
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
      if (request === exampleRequest.current) { store.create({ code: source, filename: example.arquivo, exampleId: id }); setHome(false); setMobileTab('editor'); }
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
  function save(document = store.active, name = document.filename) {
    download(new Blob([document.code], { type: 'text/plain;charset=utf-8' }), name);
    store.update({ filename: name, savedCode: document.code }, document.id);
  }
  function newFile() { if (busy || loadingExample) return; ++exampleRequest.current; store.create(); setHome(false); setMobileTab('editor'); setError(''); }
  function closeFile(document) {
    if (busy) return;
    if (document.code !== document.savedCode || Object.keys(document.localFiles || {}).length) setDialog({ kind: 'close', id: document.id, filename: document.filename, localResources: !!Object.keys(document.localFiles || {}).length });
    else store.close(document.id);
  }
  function submitDialog(value) {
    const document = store.documents.find(document => document.id === dialog.id);
    if (dialog.kind === 'close') { if (value) save(document); store.close(document.id); }
    else save(document, value);
    setDialog(null);
  }
  function openPicker() { if (!busy && !loadingExample) fileInput.current.click(); }
  function clearOutput() { if (busy) return; terminalRef.current?.replaceChildren(); canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); }

  function stop() { cancel.current = true; runtimeRef.current?.abort(); }
  const run = useCallback(async (debugMode = false) => {
    debugMode = debugMode === true; setPaused(null);
    if (running.current || loadingExample || !store.ready) return;
    setHome(false); setMobileTab('execucao'); setView('terminal'); running.current = true; cancel.current = false; setBusy(true); setError(''); setStatus('Preparando');
    runtimeRef.current?.destroy(); runtimeRef.current = null; terminalRef.current.replaceChildren();
    let files, runtime;
    try {
      if (analysis.diagnostics.some(item => item.severity === 'error')) throw Object.assign(new Error('Corrija os erros indicados no painel de mensagens.'), { compilation: true });
      setValues({}); setRuntimeDiagnostic(null); inspection.current = {};
      const compiled = transpilePortugol(code, { inspect: true, debug: true });
      files = await createRuntimeFiles(refresh, report, examples.find(example => example.id === selected), localFiles);
      if (cancel.current) throw new Error('EXECUCAO_INTERROMPIDA');
      runtime = new PortugolRuntime(canvas, terminalRef.current, { files, masterVolume: audioRef.current.muted ? 0 : audioRef.current.volume, onResize: (w, h) => setResolution(w + ' × ' + h), onTitleChange: setTitle });
      runtime.debugger = new ExecutionDebugger({ breakpoints: editorRef.current?.breakpoints(), lineAt: from => code.slice(0, from).split('\n').length, onPause: state => { setPaused(state); publishInspection(); setStatus('Pausado'); setShowInspector(true); setSidebarTab('symbols'); setMobileTab('editor'); } });
      if (!debugMode) runtime.debugger.mode = 'continue';
      runtime.inspect = (scope, from, symbols) => {
        runtime.debugger?.inspect(scope, from, symbols);
        runtime.sourcePosition = from;
        for (const symbol of symbols) {
          const owner = analysis.symbols.some(item => item.kind === 'variable' && item.from === symbol.from && item.name === symbol.name) ? 'programa' : scope;
          inspection.current[`${owner}:${symbol.from}`] = symbol.value;
        }
        if (!inspectionFrame.current) inspectionFrame.current = requestAnimationFrame(() => { inspectionFrame.current = null; publishInspection(); });
      };
      const readInput = runtime.leia.bind(runtime);
      runtime.leia = type => { setView('terminal'); return readInput(type); };
      const startGraphics = runtime.Graficos.iniciar_modo_grafico;
      runtime.Graficos.iniciar_modo_grafico = (...args) => { setView('grafico'); return startGraphics(...args); };
      runtimeRef.current = runtime; setStatus('Executando');
      await new Function('__runtime', compiled)(runtime);
      setStatus(cancel.current ? 'Interrompido' : 'Concluído');
    } catch (error) {
      if (error.message === 'EXECUCAO_INTERROMPIDA') setStatus('Interrompido');
      else { report(error); setStatus('Erro'); if (error.compilation) setView('closed'); setShowInspector(true); setSidebarTab('messages'); setMobileTab('recursos'); if (!error.compilation) { const from = error.from ?? runtime?.sourcePosition ?? 0; setRuntimeDiagnostic({ code: error.code || 'ErroExecucao.ErroExecucaoNaoTratado', from, to: error.to ?? Math.min(code.length, from + 1), severity: 'error', message: 'Execução: ' + error.message }); } }
    } finally {
      publishInspection();
      runtime?.destroy(); runtimeRef.current = null;
      try { await files?.flush(); await refresh(); } catch (error) { report(error); setStatus('Erro ao salvar arquivos'); }
      running.current = false; setBusy(false); setPaused(null);
    }
  }, [code, canvas, refresh, report, examples, selected, loadingExample, localFiles, store.ready, analysis]);
  useEffect(() => {
    const key = event => {
      if (dialog || exporting || event.defaultPrevented) return;
      if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); run(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); if (event.shiftKey) setDialog({ kind: 'save', id: store.active.id, filename }); else save(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') { event.preventDefault(); openPicker(); }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'e') { event.preventDefault(); if (!busy && !loadingExample) setExporting(true); }
      if (event.altKey && event.key.toLowerCase() === 'n') { event.preventDefault(); newFile(); }
      if (event.key === 'Escape') { stop(); setJs(null); }
    };
    const unload = event => { if (store.documents.some(document => document.code !== document.savedCode || Object.keys(document.localFiles || {}).length)) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('keydown', key); window.addEventListener('beforeunload', unload);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('beforeunload', unload); };
  }, [run, dialog, exporting, code, filename, store.documents, busy, loadingExample, home]);
  function showJs() { try { setJs(transpilePortugol(code)); } catch (error) { report(error); } }
  const locked = busy || loadingExample || !store.ready;
  const menus = [
    { label: 'Arquivo', items: [
      { label: 'Novo arquivo', shortcut: 'Alt + N', action: newFile, disabled: locked },
      { label: 'Abrir arquivo…', shortcut: 'Ctrl + O', action: openPicker, disabled: locked },
      { separator: true },
      { label: 'Salvar', shortcut: 'Ctrl + S', action: () => save() },
      { label: 'Salvar como…', shortcut: 'Ctrl + Shift + S', action: () => setDialog({ kind: 'save', id: store.active.id, filename }) },
      { label: 'Exportar projeto…', shortcut: 'Ctrl + Shift + E', action: () => setExporting(true), disabled: locked },
      { label: 'Fechar arquivo', action: () => closeFile(store.active), disabled: locked },
      { separator: true },
      { label: 'Tela inicial', action: () => setHome(true) },
    ] },
    { label: 'Exemplos', render: close => <ExamplesMenu examples={examples} disabled={locked} onSelect={id => { close(); selectExample(id); }}/> },
    { label: 'Editar', items: [
      { label: 'Desfazer', shortcut: 'Ctrl + Z', action: () => editorRef.current?.undo(), disabled: !editorInfo.canUndo },
      { label: 'Refazer', shortcut: 'Ctrl + Shift + Z', action: () => editorRef.current?.redo(), disabled: !editorInfo.canRedo },
      { separator: true },
      { label: 'Selecionar código', action: () => { setHome(false); requestAnimationFrame(() => editorRef.current?.select()); } },
      { label: 'Completar código', shortcut: 'Ctrl + Espaço', action: () => { setHome(false); setMobileTab('editor'); requestAnimationFrame(() => { editorRef.current?.focus(); editorRef.current?.complete(); }); } },
      { label: 'Copiar código', action: () => navigator.clipboard.writeText(code).catch(report) },
    ] },
    { label: 'Executar', items: [
      { label: 'Depurar programa', action: () => run(true), disabled: locked },
      { label: 'Executar programa', shortcut: 'Ctrl + Enter', action: run, disabled: locked },
      { label: 'Parar execução', shortcut: 'Esc', action: stop, disabled: !busy },
      { label: 'Limpar saída', action: clearOutput, disabled: busy },
      { label: 'Ver JavaScript transpilado', action: showJs },
    ] },
    { label: 'Exibir', items: [
      { label: showInspector ? 'Ocultar lateral' : 'Mostrar lateral', action: () => { setShowInspector(!showInspector); setHome(false); setMobileTab('editor'); } },
      { label: 'Editor', action: () => { setHome(false); setMobileTab('editor'); } },
      { label: 'Tela inicial e exemplos', action: () => setHome(true) },
      { label: showRepository ? 'Ocultar repositório' : 'Mostrar repositório', action: () => { setShowRepository(!showRepository); setHome(false); setMobileTab('recursos'); } },
      { label: 'Recolher painéis de execução', action: () => { setView('closed'); setMobileTab('editor'); } },
      { label: 'Restaurar layout padrão', action: () => { setShowInspector(true); setRepositoryWidth(330); setOutputRatio(.3); setGraphicsRatio(.5); setSidebarTab('messages'); setView('closed'); setMobileTab('editor'); } },
      ...['ambos', 'grafico', 'terminal'].map(mode => ({ label: { ambos: 'Gráfico e terminal', grafico: 'Somente gráfico', terminal: 'Somente terminal' }[mode], action: () => { setView(mode); setHome(false); setMobileTab('execucao'); } })),
    ] },
  ];
  return <div className="ide-shell">
    <header className="ide-toolbar">
      <button className="ide-brand" onClick={() => setHome(true)} title="Tela inicial"><img className="brand-logo" src={assetUrl('portugol-logo.png')} alt="" width="28" height="28"/><span>Portugol Studio <small>Web</small></span></button>
      <MenuBar menus={menus}/>
      <input ref={fileInput} type="file" accept=".por" hidden onChange={event => { if (event.target.files[0]) open(event.target.files[0]); event.target.value = ''; }}/>
    </header>
    {exporting && <ExportDialog project={{ code, filename, example: activeExample, entries, localFiles, volume: audioSettings.muted ? 0 : audioSettings.volume }} onClose={() => setExporting(false)}/>}
    <div className="ide-body">
      <aside className="tool-rail command-rail" aria-label="Comandos e ferramentas">
        {!home && <>
        <button className="rail-run" aria-label="Executar programa" title="Executar programa (Ctrl + Enter)" disabled={locked} onClick={run}><Play size={22}/></button>
        <button className="rail-debug" aria-label="Depurar" title="Depurar programa · clique na margem do editor para marcar pontos de parada" disabled={locked} onClick={() => run(true)}><Footprints size={21} aria-hidden="true"/></button>
        <button className="rail-stop" aria-label="Parar execução" title="Parar execução (Esc)" disabled={!busy} onClick={stop}><Square size={19}/></button>
        <span className="rail-divider"/>
        <button className="rail-file" aria-label="Novo arquivo" title="Novo arquivo (Alt + N)" disabled={locked} onClick={newFile}><FilePlus2 size={20}/></button>
        <button className="rail-open" aria-label="Abrir arquivo" title="Abrir arquivo (Ctrl + O)" disabled={locked} onClick={openPicker}><FolderOpen size={22}/></button>
        <button className="rail-save" aria-label="Salvar arquivo" title="Salvar arquivo (Ctrl + S)" onClick={() => save()}><Save size={20}/></button>
        <button className="rail-save" aria-label="Salvar como" title="Salvar como (Ctrl + Shift + S)" onClick={() => setDialog({ kind: 'save', id: store.active.id, filename })}><SaveAll size={20}/></button>
        <button className="rail-export" aria-label="Exportar projeto" title="Exportar projeto (Ctrl + Shift + E)" disabled={locked} onClick={() => setExporting(true)}><Share2 size={20}/></button>
        <span className="rail-divider"/>
        </>}
        <button aria-label="Mostrar editor" title="Editor" aria-pressed={!home && mobileTab === 'editor'} onClick={() => { setHome(false); setMobileTab('editor'); requestAnimationFrame(() => editorRef.current?.focus()); }}><Code2 size={20}/></button>
        <button aria-label="Mostrar recursos" title="Recursos do programa" aria-pressed={!home && showRepository} onClick={() => { setHome(false); showSidebar('resources'); }}><Files size={20}/></button>
        <button aria-label="Mostrar mensagens" title="Mensagens do código" onClick={() => showSidebar('messages')}><CircleAlert size={20}/></button>
        <button aria-label="Mostrar árvore" title="Árvore do código" onClick={() => showSidebar('symbols')}><ListTree size={20}/></button>
        <button className="rail-open" aria-label="Abrir ajuda" title="Ajuda do Portugol" onClick={() => { setHomeSection('help'); setHome(true); }}><BookOpen size={22}/></button>
        <span className="rail-spacer"/>
        <button aria-label="Tela inicial" title="Tela inicial" onClick={() => { setHomeSection('examples'); setHome(true); }}><Home size={20}/></button>
        <button aria-label="Mostrar terminal" title="Terminal" onClick={() => { setHome(false); setMobileTab('execucao'); setView(view === 'terminal' ? 'closed' : 'terminal'); }}><TerminalSquare size={20}/></button>
        <button aria-label="Mostrar gráfico" title="Modo gráfico" onClick={() => { setHome(false); setMobileTab('execucao'); setView(view === 'grafico' ? 'closed' : 'grafico'); }}><Monitor size={20}/></button>
      </aside>
      <div className="ide-main">
    {home && <Welcome section={homeSection} onSectionChange={setHomeSection} examples={examples} documents={store.documents} onNew={newFile} onOpen={openPicker} onExample={selectExample} onContinue={id => { store.activate(id); setHome(false); setMobileTab('editor'); }} loading={locked}/>}
    {(error || store.storageError) && <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-lg border border-red-400/40 bg-red-950/30 p-3 text-sm text-red-200"><span>{error || store.storageError}</span><button aria-label="Fechar aviso" onClick={() => setError('')}>×</button></div>}
    {!home && <nav className="mobile-tools" aria-label="Área de trabalho">{[{ id: 'editor', label: 'Editor', icon: Code2 }, { id: 'recursos', label: 'Ferramentas', icon: ListTree }, { id: 'execucao', label: 'Execução', icon: TerminalSquare }].map(tool => <button key={tool.id} aria-pressed={mobileTab === tool.id} onClick={() => { setMobileTab(tool.id); if (tool.id === 'recursos') setShowInspector(true); if (tool.id === 'execucao') setView(current => current === 'closed' ? 'terminal' : current); }}><tool.icon size={15}/>{tool.label}</button>)}</nav>}
    <main ref={workspaceRef} style={{ '--repository-width': repositoryWidth + 'px', '--editor-weight': (1 - outputRatio) + 'fr', '--output-weight': outputRatio + 'fr' }} data-output={view === 'closed' ? 'closed' : 'open'} className={(home ? 'hidden ' : '') + 'ide-workspace'} data-mobile-tab={mobileTab} data-repository={showRepository ? 'open' : 'closed'}>
      <div className="workspace-editor"><div role="tablist" aria-label="Arquivos abertos" className="file-tabs"><div className="file-tab home-tab"><button role="tab" aria-selected={false} className="file-tab-label" title="Tela inicial" onClick={() => { setHomeSection('examples'); setHome(true); }}><img src={assetUrl('portugol-logo.png')} alt="" width="16" height="16"/><span>Início</span></button></div>{store.documents.map(document => <div key={document.id} className={"file-tab " + (store.active.id === document.id ? "is-active" : "")}><button role="tab" aria-selected={store.active.id === document.id} disabled={busy} className="file-tab-label" onClick={() => store.activate(document.id)}>{document.filename}{document.code !== document.savedCode || Object.keys(document.localFiles || {}).length ? ' •' : ''}</button><button aria-label={'Fechar ' + document.filename} disabled={locked} className="file-tab-close" onClick={() => closeFile(document)}><X size={12}/></button></div>)}</div><div className="editor-inspection-layout" data-mobile-area={mobileTab} style={{ '--sidebar-width': repositoryWidth + 'px' }}><Suspense fallback={<div className="p-6 text-sm text-slate-400">Carregando editor…</div>}><Editor onBreakpoints={lines => { if (runtimeRef.current?.debugger) runtimeRef.current.debugger.breakpoints = new Set(lines); }} busy={busy} paused={paused} onDebugCommand={command => { if (command === 'stop') stop(); else if (command === 'pause') runtimeRef.current?.debugger?.pause(); else { setPaused(null); setStatus('Executando'); runtimeRef.current?.debugger?.resume(command); } }} diagnostics={diagnostics} inputRef={editorRef} documentId={store.active.id} onRun={run} onStatus={setEditorInfo} code={code} onChange={setCode} filename={filename} onOpen={open} onSave={() => save()}/></Suspense>{showInspector && <><ResizeHandle label="Largura da lateral" className="sidebar-resizer" value={repositoryWidth} onChange={setRepositoryWidth} min={280} max={480} getValue={event => workspaceRef.current.getBoundingClientRect().right - event.clientX}/><CodeInspector key={store.active.id} tab={sidebarTab} onTabChange={setSidebarTab} onCollapse={() => { setShowInspector(false); setMobileTab('editor'); }} paused={paused} onFix={fix => editorRef.current?.fix(fix)} code={code} diagnostics={diagnostics} symbols={analysis.symbols} values={values} busy={busy} onNavigate={position => { setMobileTab('editor'); editorRef.current?.navigate(position); }} resources={<FileRepository onCollapse={() => setSidebarTab('messages')} key={store.active.id} code={code} example={activeExample} localFiles={localFiles} onLocalFilesChange={localFiles => store.update({ localFiles })} entries={entries} refresh={refresh} busy={busy || !store.ready} onError={report}/>}/></>}</div></div>
      {view !== 'closed' && <ResizeHandle label="Tamanho dos painéis de execução" className="output-resizer" orientation={stacked ? 'horizontal' : 'vertical'} value={outputRatio} onChange={setOutputRatio} min={.2} max={.65} getValue={resizeOutput}/>}
      <div ref={outputRef} className={"workspace-output " + (view === 'closed' ? 'hidden' : '')} style={{ '--graphics-weight': graphicsRatio + 'fr', '--terminal-weight': (1 - graphicsRatio) + 'fr' }} data-view={view}>
        <nav className="output-tabs" aria-label="Painéis de execução">{['ambos', 'grafico', 'terminal'].map(mode => <button key={mode} aria-pressed={view === mode} className={view === mode ? 'active-button' : ''} onClick={() => setView(mode)}>{{ ambos: 'Ambos', grafico: 'Gráfico', terminal: 'Terminal' }[mode]}</button>)}<button className="collapse-output" aria-label="Recolher painéis de execução" title="Recolher painéis de execução" onClick={() => { setView('closed'); setMobileTab('editor'); }}><PanelRight size={15}/></button></nav>
        <div className={"graphic-tool " + (view === 'terminal' ? 'hidden' : '')}><Graphics terminalRef={terminalRef} status={status} busy={busy} onStop={stop} onDetachedChange={detached => { setExecutionDetached(detached); if (!detached) { setView('ambos'); setMobileTab('execucao'); } }} onCollapse={() => collapsePanel('grafico')} canvas={canvas} runtimeRef={runtimeRef} title={title} resolution={resolution} onError={report}/></div>
        {view === 'ambos' && <ResizeHandle label="Divisão entre gráfico e terminal" className="panels-resizer" orientation={stacked ? 'vertical' : 'horizontal'} value={graphicsRatio} onChange={setGraphicsRatio} min={.2} max={.8} getValue={resizeGraphics}/>}
        <div className={'terminal-tool ' + (view === 'grafico' ? 'hidden' : '')}><Terminal detached={executionDetached} onFocusExecution={() => canvas.ownerDocument.defaultView.focus()} onCollapse={() => collapsePanel('terminal')} terminalRef={terminalRef} clear={() => terminalRef.current.replaceChildren()}/></div>
      </div>
    </main>
      </div>
    </div>
    <footer className="ide-status"><span className={busy ? 'text-green-300' : ''}>● {status}</span><span className="status-hint">Ctrl + Espaço · Completar código</span><span>Lin {editorInfo.line}, Col {editorInfo.column}</span><span className="desktop-label">UTF-8</span><VolumeControl settings={audioSettings} onChange={changeVolume}/></footer>
    {dialog && <FileDialog key={dialog.kind + dialog.id} dialog={dialog} onClose={() => setDialog(null)} onSubmit={submitDialog}/>}
    {js !== null && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={() => setJs(null)}><section role="dialog" aria-modal="true" aria-label="JavaScript transpilado" className="panel flex max-h-[85vh] w-full max-w-4xl flex-col" onClick={e => e.stopPropagation()}><div className="panel-heading"><span>JavaScript transpilado</span><button autoFocus onClick={() => setJs(null)}>Fechar ×</button></div><pre className="overflow-auto p-5 font-mono text-xs leading-6">{js}</pre></section></div>}
  </div>;
}
