import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, File, FileImage, FileAudio, FolderOpen, MoreHorizontal, Plus, RefreshCw, Search, Settings2, Upload, Undo2, Trash2, AlertCircle, X } from 'lucide-react';
import { repository, download, normalizePath } from '../services/repository.js';
import { collectResources } from '../services/resources.js';

function Thumbnail({ entry }) {
  const [url, setUrl] = useState(null);
  const image = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(entry.path) || entry.type?.startsWith('image/');
  useEffect(() => {
    let alive = true, objectURL; setUrl(null);
    if (!entry.read || !image) return;
    entry.read().then(blob => { if (!alive) return; objectURL = URL.createObjectURL(blob); setUrl(objectURL); }).catch(error => console.warn('Prévia indisponível:', entry.path, error));
    return () => { alive = false; if (objectURL) URL.revokeObjectURL(objectURL); };
  }, [entry.path, entry.source, entry.blob, entry.updatedAt, entry.originalURL]);
  const Icon = entry.source === 'missing' ? AlertCircle : image ? FileImage : /\.(mp3|wav|ogg|m4a)$/i.test(entry.path) ? FileAudio : File;
  return <span className="resource-thumbnail">{url ? <img src={url} alt={'Prévia de ' + entry.path} loading="lazy"/> : <Icon size={20}/>}</span>;
}
const sourceLabels = { original: 'Exemplo', local: 'Local', server: 'Servidor', missing: 'Ausente' };
function sizeLabel(size) { return size < 1024 ? size + ' B' : size < 1024 * 1024 ? (size / 1024).toFixed(1) + ' KB' : (size / 1024 / 1024).toFixed(1) + ' MB'; }
export default function FileRepository({ entries, refresh, busy, onError, code, example, localFiles, onLocalFilesChange }) {
  const input = useRef(), replacement = useRef(), target = useRef();
  const [prefix, setPrefix] = useState(''), [working, setWorking] = useState(false), [pendingDelete, setPendingDelete] = useState(null), [search, setSearch] = useState(''), [destination, setDestination] = useState('local'), [settings, setSettings] = useState(false), [menu, setMenu] = useState(null);
  const resources = useMemo(() => collectResources(code, example, entries, localFiles), [code, example, entries, localFiles]);
  const filtered = resources.filter(entry => entry.path.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const locked = busy || working;
  async function action(callback) { setWorking(true); try { await callback(); await refresh(); } catch (error) { onError(error); } finally { setWorking(false); } }
  function restore(path) { const files = { ...localFiles }; delete files[path]; onLocalFilesChange(files); setMenu(null); }
  function replace(entry) { setMenu(null); target.current = entry.path; replacement.current.accept = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(entry.path) ? 'image/*' : ''; replacement.current.click(); }
  async function upload(files) {
    if (destination === 'server') return action(async () => { for (const file of files) await repository.write(normalizePath((prefix ? prefix + '/' : '') + file.name), file); });
    try { const additions = Object.fromEntries(files.map(file => [normalizePath((prefix ? prefix + '/' : '') + file.name), file])); onLocalFilesChange({ ...localFiles, ...additions }); } catch (error) { onError(error); }
  }
  return <section className="panel resource-panel" aria-label="Repositório de recursos">
    <div className="panel-heading"><span className="resource-heading"><FolderOpen size={14}/> Repositório <small>{resources.length}</small></span><button aria-label="Atualizar repositório" title="Atualizar repositório" disabled={working} onClick={() => action(async () => {})}><RefreshCw size={13}/></button></div>
    <div className="resource-toolbar">
      {example && <p className="resource-program" title={example.nome}>{example.nome}</p>}
      <div className="resource-upload"><button disabled={locked} onClick={() => input.current.click()}><Plus size={14}/> Adicionar arquivos</button><button aria-label="Configurar envio de arquivos" title="Pasta e destino do envio" aria-expanded={settings} onClick={() => setSettings(!settings)}><Settings2 size={14}/></button></div>
      <p className="resource-destination">{destination === 'local' ? 'Nesta aba' : 'Servidor compartilhado'}{prefix && ' / ' + prefix}</p>
      {settings && <div className="resource-settings"><label>Pasta de destino<input aria-label="Pasta de destino" placeholder="Ex.: imagens" value={prefix} onChange={e => setPrefix(e.target.value)} disabled={locked}/></label><label>Adicionar em<select aria-label="Destino dos arquivos" value={destination} onChange={e => setDestination(e.target.value)} disabled={locked}><option value="local">Esta aba (local)</option><option value="server">Servidor compartilhado</option></select></label></div>}
      <input ref={input} type="file" multiple hidden onChange={e => { const files = [...e.target.files]; e.target.value = ''; upload(files); }}/>
      <input ref={replacement} type="file" hidden onChange={e => { const file = e.target.files[0]; e.target.value = ''; if (file) onLocalFilesChange({ ...localFiles, [target.current]: file }); }}/>
      <label className="resource-search"><Search size={13}/><input aria-label="Buscar recursos" placeholder="Buscar arquivos…" value={search} onChange={e => setSearch(e.target.value)}/>{search && <button aria-label="Limpar busca de recursos" onClick={() => setSearch('')}><X size={12}/></button>}</label>
    </div>
    <div className="resource-list">
      {!filtered.length && <div className="resource-empty"><FolderOpen size={28}/><p>{search ? 'Nenhum arquivo encontrado' : 'Seus recursos aparecem aqui'}</p><span>{search ? 'Tente buscar por outro nome.' : 'Adicione imagens, sons ou arquivos usados no programa.'}</span></div>}
      {filtered.map(entry => { const parts = entry.path.split('/'), name = parts.pop(), directory = parts.join('/'); return <div key={entry.path} className="resource-item" data-source={entry.source} data-resource-path={entry.path}>
        <div className="resource-row"><Thumbnail entry={entry}/><div className="resource-info"><strong title={entry.path}>{name}</strong>{directory && <span className="resource-path" title={directory}>{directory}/</span>}<div className="resource-meta"><span className="resource-source">{sourceLabels[entry.source]}</span>{entry.size !== undefined && <span>{sizeLabel(entry.size)}</span>}</div></div><button className="resource-more" aria-label={'Ações de ' + entry.path} title="Ações do arquivo" aria-expanded={menu === entry.path} onClick={() => setMenu(menu === entry.path ? null : entry.path)}><MoreHorizontal size={16}/></button></div>
        {entry.source === 'missing' && <button className="resource-missing-action" disabled={locked} onClick={() => replace(entry)}><Upload size={12}/> Adicionar neste caminho</button>}
        {menu === entry.path && <div className="resource-actions"><button disabled={locked} onClick={() => replace(entry)}><Upload size={13}/>{entry.source === 'missing' ? 'Adicionar neste caminho' : 'Substituir localmente'}</button>{entry.read && <button disabled={working} onClick={() => { setMenu(null); action(async () => download(await entry.read(), entry.path)); }}><Download size={13}/> Baixar arquivo</button>}{entry.source === 'local' && <button disabled={locked} onClick={() => restore(entry.path)}>{entry.originalURL || entries.some(file => file.path === entry.path) ? <Undo2 size={13}/> : <Trash2 size={13}/>} {entry.originalURL || entries.some(file => file.path === entry.path) ? 'Desfazer troca' : 'Remover local'}</button>}{entry.source === 'server' && <button className="resource-delete" disabled={locked} onClick={() => { setMenu(null); setPendingDelete(entry.path); }}><Trash2 size={13}/> Excluir do servidor</button>}</div>}
        {pendingDelete === entry.path && <div className="resource-confirm">Excluir este arquivo do servidor?<div><button disabled={locked} onClick={() => action(async () => { await repository.remove(entry.path); setPendingDelete(null); })}>Excluir</button><button onClick={() => setPendingDelete(null)}>Cancelar</button></div></div>}
      </div>; })}
    </div>
    <div className="resource-footer">{Object.keys(localFiles).length ? 'Alterações locais nesta sessão. Baixe para guardar.' : 'Imagens e arquivos usados pelo programa.'}</div>
  </section>;
}
