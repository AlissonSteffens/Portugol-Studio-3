import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function TabContextMenu({ menu, items, onClose }) {
  const root = useRef();
  useLayoutEffect(() => {
    const node = root.current, rect = node.getBoundingClientRect();
    node.style.left = Math.max(8, Math.min(menu.x, window.innerWidth - rect.width - 8)) + 'px';
    node.style.top = Math.max(8, Math.min(menu.y, window.innerHeight - rect.height - 8)) + 'px';
    node.querySelector('button:not(:disabled)')?.focus();
  }, [menu]);
  useEffect(() => {
    const outside = event => { if (!root.current.contains(event.target)) onClose(); };
    const escape = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); menu.opener?.focus(); }
    };
    const dismiss = () => onClose();
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('resize', dismiss);
    document.addEventListener('scroll', dismiss, true);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', dismiss);
      document.removeEventListener('scroll', dismiss, true);
    };
  }, [menu, onClose]);
  return createPortal(<div ref={root} role="menu" aria-label={'Ações da aba ' + menu.filename} className="tab-context-menu" style={{ left: menu.x, top: menu.y }} onContextMenu={event => event.preventDefault()} onKeyDown={event => {
    if (event.key === 'Tab') { onClose(); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...root.current.querySelectorAll('button:not(:disabled)')], index = buttons.indexOf(document.activeElement);
    buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  }}>{items.map(item => <button key={item.label} role="menuitem" disabled={item.disabled} onClick={() => { onClose(); item.action(); }}>{item.label}</button>)}</div>, document.body);
}
