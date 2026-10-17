const unknown = 'Desconhecido';
const matches = (view, query) => !!view?.matchMedia?.(query).matches;
const size = value => Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
const isIPad = nav => /iPad/i.test(nav.userAgent || '') || (/Mac/i.test(nav.platform || '') && nav.maxTouchPoints > 1);

function tablet(nav) {
  if (isIPad(nav)) return true;
  const ua = nav.userAgent || '';
  return /Tablet|Kindle|Silk\/|PlayBook/i.test(ua) || (/Android/i.test(ua) && !/Mobi/i.test(ua) && nav.userAgentData?.mobile !== true);
}
function mobile(nav) {
  if (tablet(nav)) return false;
  if (typeof nav.userAgentData?.mobile === 'boolean') return nav.userAgentData.mobile;
  return /Mobi|iPhone|iPod|Windows Phone/i.test(nav.userAgent || '');
}
function browserName(nav) {
  const ua = nav.userAgent || '';
  // More specific Chromium/iOS browser tokens must precede Chrome and Safari.
  for (const [pattern, name] of [
    [/Edg(?:e|A|iOS)?\//i, 'Edge'], [/OPR\/|OPiOS\/|Opera/i, 'Opera'],
    [/SamsungBrowser\//i, 'Samsung Internet'], [/FxiOS\/|Firefox\//i, 'Firefox'],
  ]) if (pattern.test(ua)) return name;
  const brands = nav.userAgentData?.brands || [];
  for (const [brand, name] of [['Microsoft Edge', 'Edge'], ['Opera', 'Opera'], ['Google Chrome', 'Chrome'], ['Chromium', 'Chromium']]) {
    if (brands.some(item => item.brand === brand)) return name;
  }
  if (/Chrome\/|CriOS\//i.test(ua)) return 'Chrome';
  if (/Version\/.*Safari\//i.test(ua)) return 'Safari';
  return unknown;
}
function operatingSystem(nav) {
  if (isIPad(nav)) return 'iPadOS';
  const ua = nav.userAgent || '';
  if (/iPhone|iPod/i.test(ua)) return 'iOS';
  if (/Windows Phone/i.test(ua)) return 'Windows Phone';
  const platforms = { android: 'Android', windows: 'Windows', macos: 'macOS', 'chrome os': 'ChromeOS', chromeos: 'ChromeOS', linux: 'Linux', ios: 'iOS' };
  const hinted = platforms[nav.userAgentData?.platform?.toLowerCase()];
  if (hinted) return hinted;
  for (const [pattern, name] of [[/Android/i, 'Android'], [/CrOS/i, 'ChromeOS'], [/Windows|Win32|Win64/i, 'Windows'], [/Macintosh|Mac OS|MacIntel/i, 'macOS'], [/Linux/i, 'Linux']]) {
    if (pattern.test(ua + ' ' + (nav.platform || ''))) return name;
  }
  return unknown;
}

export function installNavigatorLibrary(runtime) {
  // Resolve on each call so resize, connectivity and detached windows stay current.
  const view = () => runtime.canvas?.ownerDocument?.defaultView || runtime.__presentationWindow || (typeof window !== 'undefined' ? window : null);
  const nav = () => view()?.navigator || {};
  runtime.Navegador = {
    obter_nome: () => browserName(nav()),
    obter_sistema_operacional: () => operatingSystem(nav()),
    eh_celular: () => mobile(nav()),
    eh_tablet: () => tablet(nav()),
    suporta_toque: () => (nav().maxTouchPoints || 0) > 0 || matches(view(), '(any-pointer: coarse)'),
    possui_mouse: () => matches(view(), '(any-pointer: fine)'),
    largura_janela: () => size(view()?.innerWidth),
    altura_janela: () => size(view()?.innerHeight),
    largura_tela: () => size(view()?.screen?.width),
    altura_tela: () => size(view()?.screen?.height),
    densidade_pixels: () => { const value = view()?.devicePixelRatio; return Number.isFinite(value) && value > 0 ? value : 1; },
    obter_idioma: () => nav().language || nav().languages?.[0] || '',
    esta_online: () => nav().onLine === true,
    obter_orientacao: () => {
      const width = size(view()?.innerWidth), height = size(view()?.innerHeight);
      return !width || !height ? unknown : width > height ? 'paisagem' : 'retrato';
    },
  };
}
