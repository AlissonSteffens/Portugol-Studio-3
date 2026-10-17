import { assetUrl } from '../services/assets.js';
import Help from './Help.jsx';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Code2, FileCode2, FolderOpen, Plus, Search, Clock3, X, ChevronRight, Folder } from 'lucide-react';

const searchable = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export default function Welcome({ section, onSectionChange, examples, documents, onNew, onOpen, onExample, onHelpExample, onContinue, loading, recentExampleIds = [], onClearRecentExamples }) {
  const [search, setSearch] = useState('');
  const [allDocuments, setAllDocuments] = useState(false), [showDocuments, setShowDocuments] = useState(false), [failedImages, setFailedImages] = useState(() => new Set());
  const query = searchable(search.trim());
  const matching = useMemo(() => examples.filter(example => searchable(`${example.nome} ${example.categoria} ${example.descricao || ''}`).includes(query)), [examples, query]);
  const tree = useMemo(() => {
    const root = { children: new Map() };
    for (const example of matching) {
      let node = root;
      for (const name of example.categoria.split(' / ')) {
        if (!node.children.has(name)) node.children.set(name, { name, children: new Map(), examples: [], count: 0 });
        node = node.children.get(name); node.count++;
      }
      node.examples.push(example);
    }
    return root;
  }, [matching]);
  const recent = recentExampleIds.map(id => examples.find(example => example.id === id)).filter(Boolean);
  const hasPreview = example => !!example.imagem && !failedImages.has(example.imagem);
  const changeSearch = setSearch;
  const renderExample = example => <button key={example.id} aria-label={example.nome} disabled={loading} onClick={() => onExample(example.id)}>
    <span className={hasPreview(example) ? 'welcome-catalog-preview' : 'welcome-file-icon'}>{hasPreview(example) ? <img src={assetUrl('exemplos/' + example.imagem)} alt="" loading="lazy" onError={() => setFailedImages(previous => new Set(previous).add(example.imagem))}/> : <FileCode2 size={21}/>}</span>
    <span className="welcome-example-text"><small>{example.categoria}</small><strong>{example.nome}</strong>{example.descricao && <span>{example.descricao}</span>}</span><ArrowRight size={16}/>
  </button>;

  return <main className="welcome-page welcome-studio welcome-simple">
    <aside className="welcome-sidebar">
      <div className="welcome-wordmark"><img className="welcome-logo" src={assetUrl('portugol-logo.png')} alt="" width="32" height="32"/><div>Seu espaço<small>Portugol Studio</small></div></div>
      <button className="welcome-new" disabled={loading} onClick={onNew}><Plus size={17}/> Novo programa <kbd>Alt N</kbd></button>
      <button className="welcome-open" disabled={loading} onClick={onOpen}><FolderOpen size={17}/> Abrir arquivo .por</button>
      <nav className="welcome-navigation" aria-label="Conteúdo da home"><button aria-pressed={section === 'examples'} onClick={() => onSectionChange('examples')}><Code2 size={17}/> Exemplos</button><button aria-pressed={section === 'help'} onClick={() => onSectionChange('help')}><BookOpen size={17}/> Ajuda</button></nav>
      <button className="welcome-mobile-files" aria-expanded={showDocuments} aria-controls="home-open-documents" onClick={() => setShowDocuments(value => !value)}><FileCode2 size={15}/> Arquivos abertos ({documents.length})</button>
      <div id="home-open-documents" className="welcome-open-documents" data-open={showDocuments}><div className="welcome-section-label">ARQUIVOS ABERTOS <span>{documents.length}</span></div>
        <div className="welcome-session">{(allDocuments ? documents : documents.slice(-4).reverse()).map(document => <button key={document.id} disabled={loading} onClick={() => onContinue(document.id)}><FileCode2 size={16}/><span>{document.filename}</span>{(document.code !== document.savedCode || Object.keys(document.localFiles || {}).length > 0) && <i title="Alterações nesta sessão"/>}<ArrowRight size={13}/></button>)}</div>
        {documents.length > 4 && <button className="welcome-text-button" aria-expanded={allDocuments} onClick={() => setAllDocuments(value => !value)}>{allDocuments ? 'Mostrar menos' : `Ver todos (${documents.length})`}</button>}
      </div>
    </aside>
    <div className={'welcome-content' + (section === 'help' ? ' welcome-content-help' : '')}>
      {section === 'help' ? <Help onOpenExample={onHelpExample} disabled={loading}/> : <>
        <header className="welcome-heading"><div><h1>Explore os exemplos</h1><p>Encontre uma ideia, abra o código e experimente.</p></div><button className="welcome-help-link" onClick={() => onSectionChange('help')}><BookOpen size={16}/> Guia de Portugol <ArrowRight size={14}/></button></header>
        <div className="welcome-catalog-toolbar"><label className="welcome-search"><Search size={18}/><input aria-label="Buscar exemplos" placeholder="Buscar por nome, assunto ou biblioteca" value={search} onChange={event => changeSearch(event.target.value)}/>{search && <button aria-label="Limpar busca de exemplos" onClick={() => changeSearch('')}><X size={15}/></button>}</label></div>
        {!query && recent.length > 0 && <section className="welcome-recent" aria-label="Exemplos acessados recentemente"><div className="welcome-section-heading"><h2><Clock3 size={16}/> Acessados recentemente</h2><button className="welcome-text-button" disabled={loading} onClick={onClearRecentExamples}>Limpar histórico</button></div><div className="welcome-recent-grid">{recent.map(example => <button key={example.id} aria-label={example.nome} disabled={loading} onClick={() => onExample(example.id)}><FileCode2 size={19}/><span><strong>{example.nome}</strong><small>{example.categoria.split(' / ')[0]}</small></span><ArrowRight size={14}/></button>)}</div></section>}
        <section className="welcome-catalog" aria-label="Biblioteca de exemplos">
          <div className="welcome-section-heading"><h2>{query ? 'Resultados da busca' : 'Biblioteca de exemplos'}</h2><span role="status">{matching.length} {matching.length === 1 ? 'exemplo' : 'exemplos'}</span></div>
          <div className="welcome-category-tree" aria-label="Categorias dos exemplos">{[...tree.children].map(([name, node]) => <ExampleCategory key={name} node={node} searching={!!query} renderExample={renderExample}/>)}</div>
          {!matching.length && <div className="welcome-empty"><Search size={26}/><strong>{examples.length ? 'Nenhum exemplo encontrado' : 'Carregando exemplos…'}</strong>{examples.length > 0 && <><p>Tente outro termo ou categoria na busca.</p><button onClick={() => changeSearch('')}>Limpar busca</button></>}</div>}
        </section>
      </>}
    </div>
  </main>;
}

function ExampleCategory({ node, searching, renderExample, path = node.name }) {
  const [expanded, setExpanded] = useState(false);
  const open = searching || expanded;
  const id = 'example-category-' + encodeURIComponent(path);
  return <section className="welcome-category">
    <button className="welcome-category-toggle" aria-expanded={open} aria-controls={id} onClick={() => setExpanded(value => !value)} disabled={searching}><ChevronRight size={15} className={open ? 'is-expanded' : ''}/><Folder size={17}/><span>{node.name}</span><small>{node.count}</small></button>
    <div id={id} hidden={!open} className="welcome-category-children">
      {open && <>{[...node.children].map(([name, child]) => <ExampleCategory key={name} node={child} searching={searching} renderExample={renderExample} path={path + '/' + name}/>)}{node.examples.length > 0 && <div className="welcome-example-list">{node.examples.map(renderExample)}</div>}</>}
    </div>
  </section>;
}
