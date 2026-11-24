import './landing.css';

const labels = { windows: 'Windows', macos: 'macOS', linux: 'Linux' };

/** Best-effort guess of the visitor's desktop system; null on phones, tablets and Chromebooks. */
export function detectSystem(nav = navigator) {
  const platform = (nav.userAgentData?.platform || nav.platform || '').toLowerCase();
  const agent = (nav.userAgent || '').toLowerCase();
  const mobile = nav.userAgentData?.mobile || /android|iphone|ipad|ipod|mobile/.test(agent) || (platform === 'macintel' && nav.maxTouchPoints > 1);
  if (mobile || /cros/.test(agent)) return null;
  if (platform.startsWith('win') || agent.includes('windows')) return 'windows';
  if (platform.startsWith('mac') || agent.includes('mac os')) return 'macos';
  if (platform.includes('linux') || agent.includes('linux')) return 'linux';
  return null;
}

function setup() {
  const system = detectSystem();
  const primary = document.querySelector('[data-download-primary]');
  const note = document.querySelector('[data-download-note]');
  if (!system) {
    // Phones and Chromebooks run the web version; downloads stay listed below.
    primary?.remove();
    if (note) note.textContent = 'No celular, no tablet e no Chromebook, use a versão para navegador.';
    return;
  }
  const card = document.querySelector(`.platform[data-os="${system}"]`);
  if (!card) return;
  card.classList.add('platform-current');
  card.querySelector('.badge')?.removeAttribute('hidden');
  card.parentElement.prepend(card);
  const installer = card.querySelector('.button').href;
  for (const button of [primary, document.querySelector('[data-download-card]')]) {
    if (!button) continue;
    button.querySelector('span').textContent = 'Baixar para ' + labels[system];
    // Windows has a single installer; macOS and Linux need a choice of chip or package format.
    if (system === 'windows') button.href = installer;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
}
