import { useEffect, useLayoutEffect, useRef, useState } from 'react';
export default function MenuBar({ menus }) {
  const [open, setOpen] = useState(null), root = useRef(), popup = useRef();
  useLayoutEffect(() => {
    const place = () => {
      if (!popup.current) return;
      popup.current.style.left = '0px';
      const rect = popup.current.getBoundingClientRect();
      let offset = Math.min(0, window.innerWidth - 8 - rect.right);
      if (rect.left + offset < 8) offset += 8 - rect.left - offset;
      popup.current.style.left = offset + 'px';
    };
    place(); window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);
  useEffect(() => {
    const outside = event => { if (!root.current.contains(event.target)) setOpen(null); };
    const escape = event => { if (event.key === 'Escape' && open !== null) { event.stopPropagation(); setOpen(null); root.current.querySelector('[aria-expanded="true"]')?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <nav ref={root} aria-label="Menu principal" className="flex flex-wrap gap-1 border-b border-slate-700/70 bg-[#24262a] px-4 py-1">
    {menus.map((menu, index) => <div key={menu.label} className="relative">
      <button aria-haspopup="menu" aria-expanded={open === index} onClick={() => setOpen(open === index ? null : index)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(index); requestAnimationFrame(() => root.current.querySelector('[role=menu] button:not(:disabled)')?.focus()); } }} className="border-transparent bg-transparent">{menu.label}</button>
      {open === index && <div ref={popup} style={{ maxWidth: "calc(100vw - 16px)", minWidth: "min(256px, calc(100vw - 16px))" }} role="menu" aria-label={menu.label} className="absolute left-0 top-full z-40 mt-1 min-w-64 rounded-lg border border-slate-600 bg-[#2b2d30] p-1 shadow-xl" onKeyDown={event => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        if (event.target.tagName === 'INPUT') return;
        event.preventDefault(); const items = [...event.currentTarget.querySelectorAll('button:not(:disabled)')], position = items.indexOf(document.activeElement);
        items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (position + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
      }}>{menu.render ? menu.render(() => setOpen(null)) : menu.items.map((item, i) => item.separator ? <hr key={i} className="my-1 border-slate-600"/> : <button key={item.label} role="menuitem" disabled={item.disabled} className="flex w-full items-center justify-between gap-5 border-0 bg-transparent px-3 py-2 text-left" onClick={() => { setOpen(null); item.action(); }}><span>{item.label}</span><span className="text-[10px] text-slate-400">{item.shortcut}</span></button>)}</div>}
    </div>)}
  </nav>;
}
