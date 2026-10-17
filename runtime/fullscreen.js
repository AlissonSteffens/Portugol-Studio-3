// Viewport fullscreen works on touch browsers without requiring the Fullscreen API.
export function installFullscreen(runtime) {
  const canvas = runtime.canvas, g = runtime.Graficos;
  let previous, target, toolbar;
  const notify = () => canvas?.dispatchEvent(new canvas.ownerDocument.defaultView.Event('portugol-fullscreenchange'));
  const resize = () => g.definir_dimensoes_janela(target.innerWidth, target.innerHeight);
  const unbind = () => {
    target?.removeEventListener('resize', resize);
    toolbar?.remove(); toolbar = null;
  };
  runtime.__syncFullscreen = () => {
    if (!previous || !canvas) return;
    unbind(); target = canvas.ownerDocument.defaultView;
    target.addEventListener('resize', resize);
    toolbar = canvas.ownerDocument.createElement('button');
    toolbar.type = 'button'; toolbar.textContent = 'Sair'; toolbar.setAttribute('aria-label', 'Sair da tela cheia');
    toolbar.className = 'fullscreen-exit';
    toolbar.style.cssText = 'position:fixed;right:max(12px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));z-index:102;min-height:44px;padding:8px 12px;border:1px solid #ffffff40;border-radius:22px;background:#101827c9;color:#fff;font:12px system-ui;touch-action:manipulation';
    toolbar.onclick = () => g.sair_modo_tela_cheia();
    canvas.ownerDocument.body.append(toolbar);
    resize(); notify();
  };
  g.entrar_modo_tela_cheia = () => {
    if (previous || !canvas) return;
    previous = { size: [runtime.bufferWidth, runtime.bufferHeight], style: canvas.style.cssText };
    canvas.dataset.fullscreen = 'true';
    Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100vw', height: '100dvh', maxWidth: '100vw', maxHeight: '100dvh', margin: '0', zIndex: '100', background: '#101827', objectFit: 'contain' });
    runtime.__syncFullscreen(); runtime.options.onFullscreen?.(true);
  };
  g.sair_modo_tela_cheia = () => {
    if (!previous) return;
    unbind(); canvas.style.cssText = previous.style;
    delete canvas.dataset.fullscreen;
    const size = previous.size; previous = null;
    g.definir_dimensoes_janela(...size);
    notify(); runtime.options.onFullscreen?.(false);
  };
}
