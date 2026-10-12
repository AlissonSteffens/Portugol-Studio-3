import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
const KEY = 'portugol-studio-volume';
export function readVolume() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return { volume: Number.isFinite(saved?.volume) ? Math.min(100, Math.max(0, saved.volume)) : 100, muted: saved?.muted === true };
  } catch (error) { console.warn('Não foi possível ler a preferência de volume.', error); return { volume: 100, muted: false }; }
}
export default function VolumeControl({ settings, onChange }) {
  const [open, setOpen] = useState(false), root = useRef();
  const silent = settings.muted || settings.volume === 0;
  useEffect(() => {
    if (!open) return;
    const close = event => { if (!root.current.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { setOpen(false); root.current.querySelector('button').focus(); } };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [open]);
  function change(next) {
    onChange(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); }
    catch (error) { console.warn('Não foi possível guardar a preferência de volume.', error); }
  }
  return <div className="ide-volume" ref={root}><button aria-label="Volume geral da IDE" aria-expanded={open} aria-controls="ide-volume-panel" title={silent ? 'Volume geral: silenciado' : 'Volume geral: ' + settings.volume + '%'} onClick={() => setOpen(!open)}>{silent ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button>{open && <div id="ide-volume-panel" className="ide-volume-panel"><div><strong>Volume geral</strong><span>{silent ? 'Silenciado' : settings.volume + '%'}</span></div><input autoFocus aria-label="Volume geral" type="range" min="0" max="100" step="1" value={settings.volume} onChange={event => change({ volume: Number(event.target.value), muted: false })}/><button aria-pressed={settings.muted} onClick={() => change({ ...settings, muted: !settings.muted })}>{settings.muted ? <Volume2 size={14}/> : <VolumeX size={14}/>} {settings.muted ? 'Ativar som' : 'Silenciar'}</button></div>}</div>;
}
