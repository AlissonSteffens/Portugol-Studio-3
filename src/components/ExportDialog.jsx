import { useEffect, useRef, useState } from 'react';
import { Download, FileCode2, Package, X } from 'lucide-react';
import { prepareExport, desktopSource } from '../services/export.js';
import { download } from '../services/repository.js';
export default function ExportDialog({ project, onClose }) {
  const dialogRef = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current.querySelector('button').focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const nodes = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
      if (!nodes.length) { event.preventDefault(); return; }
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); previous?.focus(); };
  }, []);
  const [format, setFormat] = useState('html'), [working, setWorking] = useState(false), [progress, setProgress] = useState(''), [error, setError] = useState('');
  useEffect(() => { const key = event => { if (event.key === 'Escape' && !working) onClose(); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [working, onClose]);
  async function exportProject() {
    setWorking(true); setError('');
    try {
      const prepared = await prepareExport(project, setProgress);
      if (format === 'electron') download(desktopSource(prepared), prepared.filename + '-electron.zip');
      else download(new Blob([prepared.html], { type: 'text/html;charset=utf-8' }), prepared.filename + '.html');
      setProgress('Exportado com ' + prepared.count + ' recursos.');
    } catch (error) { console.error(error); setError(error.message); }
    finally { setWorking(false); }
  }
  const options = [ { id: 'html', icon: FileCode2, label: 'HTML independente', description: 'Um arquivo com o programa, runtime e recursos. Abra no navegador ou publique em um site estático.' }, { id: 'electron', icon: Package, label: 'Projeto Electron (.zip)', description: 'Pacote com HTML e configuração para abrir ou gerar o executável usando npm install e npm run build:win.' } ];
  return <div className="export-overlay"><section ref={dialogRef} className="export-dialog panel" role="dialog" aria-modal="true" aria-label="Exportar projeto"><div className="panel-heading"><span>Exportar projeto</span><button aria-label="Fechar exportação" disabled={working} onClick={onClose}><X size={16}/></button></div><div className="export-content"><h2>{project.filename}</h2><p>O arquivo atual e seus recursos serão incluídos, com as substituições locais desta aba.</p><fieldset disabled={working}><legend>Formato da exportação</legend>{options.map(option => <label key={option.id} className="export-option" data-selected={format === option.id} data-disabled={option.disabled || false}><input type="radio" name="export-format" value={option.id} checked={format === option.id} disabled={option.disabled} onChange={() => setFormat(option.id)}/><option.icon size={20}/><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</fieldset><p className="export-note">Arquivos gravados pelo programa ficam no armazenamento local do navegador ou aplicativo e podem ser baixados. Acesso à Internet no HTML depende das permissões do site consultado (CORS).</p>{progress && <p role="status">{progress}</p>}{error && <p role="alert" className="text-red-300">{error}</p>}</div><div className="export-footer"><button disabled={working} onClick={onClose}>Fechar</button><button className="active-button" disabled={working} onClick={exportProject}><Download size={14}/>{working ? 'Exportando…' : 'Exportar projeto'}</button></div></section></div>;
}

