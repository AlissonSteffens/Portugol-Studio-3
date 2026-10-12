import { assetUrl } from '../services/assets.js';
import Help from './Help.jsx';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Code2, FileCode2, FolderOpen, Plus, Search, Terminal, Command } from 'lucide-react';

export default function Welcome({ section, onSectionChange, examples, documents, onNew, onOpen, onExample, onContinue, loading }) {
  const [search, setSearch] = useState(''), [category, setCategory] = useState('');
  const [failedImages, setFailedImages] = useState(() => new Set());
  const hasPreview = example => !!example.imagem && !failedImages.has(example.imagem);
  const markImageFailed = path => setFailedImages(previous => new Set(previous).add(path));
  const categories = [...new Set(examples.map(example => example.categoria.split(' / ')[0]))];
  const filtered = useMemo(() => examples.filter(example => (!category || example.categoria.split(' / ')[0] === category) && (example.nome + ' ' + example.categoria).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))), [examples, search, category]);
  const featured = ['serpente.por', 'solar.por', 'paint.por'].map(name => examples.find(example => example.arquivo === name)).filter(Boolean);
  return <main className="welcome-page welcome-studio">
    <aside className="welcome-sidebar">
      <div className="welcome-wordmark"><img className="welcome-logo" src={assetUrl('portugol-logo.png')} alt="" width="42" height="42"/><div>Portugol Studio<small>Seu espaço para programar</small></div></div>
      <button className="welcome-new" disabled={loading} onClick={onNew}><Plus size={17}/> Novo programa <kbd>Alt N</kbd></button>
      <button className="welcome-open" disabled={loading} onClick={onOpen}><FolderOpen size={17}/> Abrir arquivo .por</button>
      <nav className="welcome-navigation" aria-label="Conteúdo da home"><button aria-pressed={section === 'examples'} onClick={() => onSectionChange('examples')}><Code2 size={17}/> Exemplos</button><button aria-pressed={section === 'help'} onClick={() => onSectionChange('help')}><BookOpen size={17}/> Ajuda</button></nav>
      <div className="welcome-section-label">ARQUIVOS DA SESSÃO <span>{documents.length}</span></div>
      <div className="welcome-session">{documents.map(document => <button key={document.id} disabled={loading} onClick={() => onContinue(document.id)}><FileCode2 size={17}/><span>{document.filename}<small>{document.exampleId ? 'Exemplo aberto' : 'Programa pessoal'}</small></span>{(document.code !== document.savedCode || Object.keys(document.localFiles || {}).length > 0) && <i title="Alterações nesta sessão"/>}<ArrowRight size={14}/></button>)}</div>
      <div className="welcome-shortcuts"><Command size={16}/><span>Atalhos úteis</span><p>Executar <kbd>Ctrl Enter</kbd></p><p>Completar código <kbd>Ctrl Espaço</kbd></p><p>Salvar arquivo <kbd>Ctrl S</kbd></p></div>
    </aside>
    <div className={"welcome-content" + (section === 'help' ? " welcome-content-help" : "")}>
      {section !== 'help' && <header className="welcome-hero"><div className="welcome-eyebrow"><span/> DA PRIMEIRA LINHA À PRÓXIMA IDEIA</div><h2>O que vamos criar hoje?</h2><p>Escreva em Portugol, veja seu programa ganhar vida e aprenda explorando o código.</p><div className="welcome-capabilities"><span><Code2 size={14}/> Editor com sugestões</span><span><Terminal size={14}/> Execução no navegador</span><span><FolderOpen size={14}/> Seus arquivos e imagens</span></div></header>}
      {section === 'help' ? <Help/> : <>
      <button className="welcome-help-card" onClick={() => onSectionChange('help')}><BookOpen size={24}/><span><strong>Precisa de uma mão para começar?</strong><small>Explore a ajuda: tipos, variáveis, funções e estruturas de controle.</small></span><span className="welcome-help-action">Abrir ajuda <ArrowRight size={16}/></span></button>
      {!search && !category && featured.length > 0 && <section className="welcome-featured"><div className="welcome-section-heading"><h3>Comece com uma ideia</h3><span>Abra, execute e transforme</span></div><div className="welcome-featured-grid">{featured.map((example, index) => <button key={example.id} className="welcome-example-feature" disabled={loading} onClick={() => onExample(example.id)}><div className="welcome-example-image">{hasPreview(example) && <img src={assetUrl('exemplos/' + example.imagem)} alt={'Prévia de ' + example.nome} onError={() => markImageFailed(example.imagem)}/>}<span>{['JOGUE COM O CÓDIGO', 'EXPLORE OS GRÁFICOS', 'CRIE ALGO SEU'][index]}</span></div><div className="welcome-example-caption"><span>{example.nome}<small>{['Um clássico para explorar lógica e interação.', 'Movimento, desenho e um universo de possibilidades.', 'Cores, ferramentas e criatividade em Portugol.'][index]}</small></span><ArrowRight size={18}/></div></button>)}</div></section>}
      <section className="welcome-catalog"><div className="welcome-section-heading"><h3><BookOpen size={17}/> Biblioteca de exemplos</h3><span>{examples.length} programas para explorar</span></div><div className="welcome-catalog-toolbar"><label className="welcome-search"><Search size={16}/><input aria-label="Buscar exemplos" placeholder="Busque uma ideia, uma função, um exemplo…" value={search} onChange={event => setSearch(event.target.value)}/></label><select aria-label="Categoria dos exemplos" value={category} onChange={event => setCategory(event.target.value)}><option value="">Todas as categorias</option>{categories.map(value => <option key={value}>{value}</option>)}</select></div><div className="welcome-example-list">{filtered.map(example => <button key={example.id} disabled={loading} onClick={() => onExample(example.id)}><span className={hasPreview(example) ? "welcome-catalog-preview" : "welcome-file-icon"}>{hasPreview(example) ? <img src={assetUrl('exemplos/' + example.imagem)} alt={'Prévia de ' + example.nome} loading="lazy" onError={() => markImageFailed(example.imagem)}/> : <FileCode2 size={19}/>}</span><span className="welcome-example-text"><strong>{example.nome}</strong><small>{example.categoria}</small>{example.descricao && <span>{example.descricao}</span>}</span><ArrowRight size={15}/></button>)}{!filtered.length && <p className="welcome-empty">{examples.length ? 'Nenhum exemplo encontrado. Tente outro nome ou categoria.' : 'Carregando catálogo…'}</p>}</div></section>
      </>}
    </div>
  </main>;
}

