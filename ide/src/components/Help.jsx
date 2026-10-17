import { assetUrl } from '../services/assets.js';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import LibraryHelp, { libraryTopics } from './LibraryHelp.jsx';

const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export default function Help({ onOpenExample, disabled }) {
  const [topics, setTopics] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    fetch(assetUrl('ajuda/index.json'), { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Não foi possível carregar a ajuda.');
      return response.json();
    }).then(data => {
      setTopics([...data, ...libraryTopics]);
      setSelected(data.find(topic => topic.group === 'Primeiros passos') || data[0]);
    }).catch(error => {
      if (error.name !== 'AbortError') { console.error(error); setError('Não foi possível carregar a ajuda. Tente novamente.'); }
    });
    return () => controller.abort();
  }, [retry]);
  function prepareArticle(event) {
    const document = event.currentTarget.contentDocument;
    if (!document) return;
    for (const block of document.querySelectorAll('.code-example pre')) {
      const source = block.textContent.trim();
      if (!source || block.parentElement.querySelector('.open-example')) continue;
      const title = block.closest('.code-example').querySelector('h3')?.textContent || selected.title;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'open-example';
      button.textContent = '↗ Abrir no editor';
      button.title = 'Criar uma cópia para editar e executar';
      button.disabled = disabled;
      button.addEventListener('click', () => onOpenExample(source, title));
      const header = document.createElement('div');
      header.className = 'code-example-header';
      const heading = block.closest('.code-example').querySelector('h3');
      block.before(header);
      if (heading) header.append(heading);
      header.append(button);
    }
  }
  const filtered = useMemo(() => topics.filter(topic => (!topic.member || query.trim()) && normalize(topic.title + ' ' + topic.group + ' ' + topic.search).includes(normalize(query.trim()))), [topics, query]);
  const groups = [...new Set(filtered.map(topic => topic.group))];
  return <section className="help-area" aria-label="Ajuda do Portugol">
    <div className="welcome-section-heading"><h3><BookOpen size={18}/> Ajuda do Portugol</h3><span>Aprenda e consulte</span></div>
    <p className="help-intro">Consulte os conceitos da linguagem e exemplos da ajuda do Portugol Studio 2. As bibliotecas podem ter diferenças nesta versão Web.</p>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div> : <div className="help-browser">
      <aside className="help-topics">
        <label className="welcome-search"><Search size={16}/><input aria-label="Buscar na ajuda" placeholder="Busque um assunto…" value={query} onChange={event => setQuery(event.target.value)}/></label>
        <nav aria-label="Tópicos da ajuda">{groups.map(group => <section key={group}><h4>{group}</h4>{filtered.filter(topic => topic.group === group).map(topic => <button key={topic.path} aria-pressed={selected?.path === topic.path} onClick={() => setSelected(topic)}>{topic.title}</button>)}</section>)}</nav>
        {!topics.length && <p role="status">Carregando ajuda…</p>}
        {topics.length > 0 && !filtered.length && <p>Nenhum assunto encontrado.</p>}
      </aside>
      <div className="help-reader" key={selected?.path}>{selected && (selected.library ? <LibraryHelp topic={selected}/> : <iframe src={assetUrl(selected.path)} title={'Ajuda: ' + selected.title} sandbox="allow-same-origin" onLoad={prepareArticle}/>)}</div>
    </div>}
  </section>;
}
