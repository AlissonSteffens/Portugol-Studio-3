// CodeMirror owns tooltip DOM; use the same quick-fix affordance as the sidebar.
export function diagnosticMessage(diagnostic, applyFix, disabled) {
  const message = document.createElement('div'); message.className = 'diagnostic-hover';
  const text = document.createElement('div'); text.className = 'diagnostic-hover-text'; text.textContent = diagnostic.message; message.append(text);
  if (!diagnostic.fixes?.length) return message;
  const footer = document.createElement('div'); footer.className = 'diagnostic-hover-footer';
  const details = document.createElement('details'); details.className = 'quick-fix';
  const summary = document.createElement('summary'); summary.className = 'diagnostic-fix';
  const bulb = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  bulb.setAttribute('viewBox', '0 0 24 24'); bulb.setAttribute('width', '14'); bulb.setAttribute('height', '14'); bulb.setAttribute('fill', 'none'); bulb.setAttribute('stroke', 'currentColor'); bulb.setAttribute('stroke-width', '1.7'); bulb.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(bulb.namespaceURI, 'path'); path.setAttribute('d', 'M9 18h6m-5 3h4M9 15c0-3-4-3-4-7a7 7 0 0 1 14 0c0 4-4 4-4 7z'); bulb.append(path);
  summary.append(bulb, document.createTextNode('Correção rápida…')); details.append(summary);
  const menu = document.createElement('div'); menu.className = 'quick-fix-menu'; menu.setAttribute('role', 'group'); menu.setAttribute('aria-label', 'Correções disponíveis');
  for (const fix of diagnostic.fixes) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = fix.label; button.disabled = disabled;
    button.addEventListener('click', () => { details.open = false; applyFix(fix); }); menu.append(button);
  }
  details.append(menu); footer.append(details); message.append(footer);
  message.addEventListener('keydown', event => { if (event.key === 'Escape') { details.open = false; event.stopPropagation(); } });
  return message;
}
