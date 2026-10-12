import { useState } from 'react';
export default function ExamplesMenu({ examples, onSelect, disabled }) {
  const [search, setSearch] = useState('');
  const filtered = examples.filter(example => (example.nome + ' ' + example.categoria).toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const categories = [...new Set(filtered.map(example => example.categoria))];
  return <div className="w-[min(420px,80vw)]">
    <div className="p-2"><input aria-label="Buscar exemplos no menu" placeholder="Buscar exemplo…" value={search} onChange={event => setSearch(event.target.value)} className="w-full"/></div>
    <div className="max-h-[65vh] overflow-auto">{categories.map(category => <section key={category}><div className="sticky top-0 bg-[#24262a] px-3 py-2 text-[10px] font-semibold text-slate-400">{category}</div>{filtered.filter(example => example.categoria === category).map(example => <button key={example.id} role="menuitem" disabled={disabled} onClick={() => onSelect(example.id)} className="block w-full rounded-none border-0 bg-transparent px-4 py-2 text-left">{example.nome}</button>)}</section>)}{!filtered.length && <p className="p-4 text-xs text-slate-400">{examples.length ? 'Nenhum exemplo encontrado.' : 'Carregando catálogo…'}</p>}</div>
  </div>;
}
