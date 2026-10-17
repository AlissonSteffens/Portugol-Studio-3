export const touchControlsStyle = `
.touch-controls{display:none;flex-shrink:0;min-width:0;padding:10px 14px;background:linear-gradient(180deg,#181818,#141414);color:#bcbec4;border-top:1px solid #303030;font:12px system-ui}
.touch-controls small{display:block;margin-bottom:7px;color:#92959c;font-size:11px}
.touch-controls-layout{display:flex;align-items:center;justify-content:space-between;gap:16px}
.touch-joystick{position:relative;width:128px;height:128px;flex-shrink:0;border:1px solid #ffffff24;border-radius:50%;background:radial-gradient(circle,#ffffff08 0 46%,transparent 47%),linear-gradient(145deg,#30313799,#15161a);box-shadow:inset 0 2px 10px #0008,0 2px 1px #ffffff0a;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.touch-joystick:before{content:'';position:absolute;inset:20px;border:1px solid #ffffff0c;border-radius:50%}
.touch-joystick-knob{position:absolute;left:calc(50% - 28px);top:calc(50% - 28px);width:56px;height:56px;border:1px solid #73757e;border-radius:50%;background:radial-gradient(circle at 35% 25%,#5c5e68,#30323a 70%);box-shadow:0 5px 12px #0009,inset 0 2px 2px #ffffff20;pointer-events:none;transition:transform .12s ease-out,border-color .12s}
.touch-joystick-knob:after{content:'';position:absolute;inset:17px;border:2px solid #ffffff18;border-radius:50%}
.touch-joystick[data-active=true]{border-color:#ffc20066;box-shadow:inset 0 2px 10px #0008,0 0 18px #ffc20010}
.touch-joystick[data-active=true] .touch-joystick-knob{transition:none;border-color:#e2c566;background:radial-gradient(circle at 35% 25%,#726b50,#39362d 70%)}
.touch-joystick-direction{position:absolute;color:#74767f;font:14px system-ui;pointer-events:none;line-height:1}
.touch-joystick-direction[data-direction=up]{top:7px;left:calc(50% - 7px)}.touch-joystick-direction[data-direction=down]{bottom:7px;left:calc(50% - 7px)}.touch-joystick-direction[data-direction=left]{left:7px;top:calc(50% - 7px)}.touch-joystick-direction[data-direction=right]{right:7px;top:calc(50% - 7px)}
.touch-joystick-direction[data-available=false]{opacity:.18}.touch-joystick-direction[data-pressed=true]{color:#ffdb66}
.touch-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px;max-height:144px;overflow:auto;min-width:0;padding:4px}
.touch-controls button{display:grid;place-items:center;width:56px;height:56px;min-width:56px;min-height:56px;flex-shrink:0;padding:4px;border:1px solid #62646e;border-radius:50%;background:linear-gradient(145deg,#41434c,#272930);box-shadow:0 4px 0 #0b0c10,0 5px 10px #0005,inset 0 1px 1px #ffffff20;color:#e2e4e9;font:600 11px system-ui;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.touch-controls button[data-primary=true]{width:64px;height:64px;border-color:#b29a48;color:#ffdd78;background:linear-gradient(145deg,#65572e,#38301d)}
.touch-controls button[data-kind=mouse]{border-color:#568b9a;color:#a1e5f2;background:linear-gradient(145deg,#345963,#1c333b)}
.touch-controls button[aria-pressed=true]{transform:translateY(3px);box-shadow:0 1px 0 #0b0c10,inset 0 2px 6px #0005;background:#70602b;border-color:#ffdb66;color:#fff0be}
@media(any-pointer:coarse){.touch-controls{display:block}}
@media(any-pointer:coarse) and (max-height:500px) and (orientation:landscape){.touch-controls{padding:5px 8px}.touch-controls small{display:none}.touch-actions{max-height:144px}}
.touch-mouse-side{display:flex;flex-direction:column;align-items:flex-end;gap:10px;margin-left:auto;min-width:0}
.touch-mouse-joystick{width:112px;height:112px;border-color:#72cbd466}
@media(any-pointer:coarse){
 .touch-controls[data-fullscreen=true]{position:fixed;inset:0;z-index:101;padding:0;border:0;background:none;pointer-events:none}
 .touch-controls[data-fullscreen=true] small{display:none}
 .touch-controls[data-fullscreen=true] .touch-controls-layout{display:flex;position:absolute;inset:auto max(14px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));align-items:flex-end;gap:12px}
 .touch-controls[data-fullscreen=true] .touch-joystick{width:112px;height:112px;background:radial-gradient(circle,#ffffff12,#0f172a55);pointer-events:auto}
 .touch-controls[data-fullscreen=true] .touch-actions{max-width:152px;max-height:144px;pointer-events:auto}
 .touch-controls[data-fullscreen=true] button{background:#1c293bc9;min-width:48px;min-height:48px;width:48px;height:48px}
 .touch-controls[data-fullscreen=true] button[data-primary=true]{width:58px;height:58px}
}
`;

export function joystickDirections(x, y, deadZone = .2) {
  // Eight sectors translate the thumb position into the game's existing keys.
  if (Math.hypot(x, y) < deadZone) return [];
  const angle = Math.atan2(y, x), octant = (Math.round(angle / (Math.PI / 4)) + 8) % 8;
  return [['right'], ['right', 'down'], ['down'], ['left', 'down'], ['left'], ['left', 'up'], ['up'], ['right', 'up']][octant];
}

// Uses the runtime input state so virtual keys also wake Teclado.ler_tecla().
export function mountTouchControls(runtime, container, profile) {
  if (!profile || (!profile.keys.length && !profile.mouse)) return () => {};
  const canvas = runtime.canvas, doc = container.ownerDocument, target = doc.defaultView;
  const root = doc.createElement('section'); root.className = 'touch-controls';
  root.setAttribute('aria-label', 'Controles de toque');
  const style = doc.createElement('style'); style.textContent = touchControlsStyle; root.append(style);
  const hint = doc.createElement('small');
  const arrowKeys = profile.keys.filter(key => key.direction);
  const wasd = { 87: 'up', 65: 'left', 83: 'down', 68: 'right' };
  const wasdKeys = profile.keys.filter(key => wasd[key.code]);
  const directionKeys = arrowKeys.length ? arrowKeys : wasdKeys.length >= 2 ? wasdKeys.map(key => ({ ...key, direction: wasd[key.code] })) : [];
  hint.textContent = profile.mouse ? (profile.relativeMouse || profile.mousePosition ? 'Joystick direito: mouse. Toque ou arraste na tela; use os botões para agir.' : 'Toque na tela ou use os botões para clicar.') : directionKeys.length ? 'Arraste o joystick para mover; use os botões para agir.' : 'Segure os botões para jogar.';
  root.append(hint);
  const layout = doc.createElement('div'); layout.className = 'touch-controls-layout'; root.append(layout);
  const actions = doc.createElement('div'); actions.className = 'touch-actions';
  layout.append(actions); container.append(root);
  const held = new Map(), gestures = new Map(), listeners = [];
  const listen = (node, type, fn, options) => { node.addEventListener(type, fn, options); listeners.push(() => node.removeEventListener(type, fn, options)); };
  const syncFullscreen = () => {
    root.dataset.fullscreen = String(canvas.dataset.fullscreen === 'true');
    if (canvas.dataset.fullscreen === 'true') doc.body.append(root);
    else container.append(root);
  };
  listen(canvas, 'portugol-fullscreenchange', syncFullscreen); syncFullscreen();
  const release = pointerId => {
    const item = held.get(pointerId); if (!item) return;
    held.delete(pointerId);
    if (![...held.values()].some(other => other.id === item.id)) {
      if (item.kind === 'key') runtime.__keyStates.set(item.code, false);
      else runtime.__mouseButtons[item.code] = false;
      item.button.setAttribute('aria-pressed', 'false');
    }
  };
  let stickPointer = null;
  const stickKeys = new Set(), indicators = new Map();
  let stick, knob;
  let releaseMouseStick = () => {};
  const pressKey = code => {
    runtime.__keyStates.set(code, true); runtime.__lastKey = code;
    for (const resolve of runtime.__keyWaitResolvers.splice(0)) resolve(code);
  };
  const releaseJoystick = () => {
    for (const code of stickKeys) runtime.__keyStates.set(code, false);
    stickKeys.clear(); stickPointer = null;
    if (stick) { stick.dataset.active = 'false'; stick.dataset.directions = ''; knob.style.transform = 'translate(0px, 0px)'; }
    for (const indicator of indicators.values()) indicator.dataset.pressed = 'false';
  };
  const reset = () => {
    releaseJoystick();
    releaseMouseStick();
    for (const id of [...held.keys()]) release(id);
    gestures.clear(); runtime.__touchMouseCaptured = false;
    runtime.__mouseButtons.fill(false); runtime.__mouseDeltaX = 0; runtime.__mouseDeltaY = 0;
  };
  if (directionKeys.length) {
    stick = doc.createElement('div'); stick.className = 'touch-joystick';
    stick.setAttribute('role', 'group'); stick.setAttribute('aria-label', 'Joystick direcional');
    stick.setAttribute('aria-description', 'Arraste em qualquer direção. Solte para parar.');
    stick.dataset.active = 'false';
    for (const [direction, label] of Object.entries({ up: '▲', down: '▼', left: '◀', right: '▶' })) {
      const indicator = doc.createElement('span'); indicator.className = 'touch-joystick-direction';
      indicator.textContent = label; indicator.dataset.direction = direction;
      indicator.dataset.available = String(directionKeys.some(key => key.direction === direction));
      indicator.setAttribute('aria-hidden', 'true'); stick.append(indicator); indicators.set(direction, indicator);
    }
    knob = doc.createElement('span'); knob.className = 'touch-joystick-knob'; knob.setAttribute('aria-hidden', 'true'); stick.append(knob);
    layout.prepend(stick);
    const moveStick = event => {
      const rect = stick.getBoundingClientRect(), radius = rect.width / 2;
      const x = event.clientX - rect.left - radius, y = event.clientY - rect.top - radius;
      const distance = Math.hypot(x, y), travel = radius - knob.offsetWidth / 2 - 5;
      const scale = distance ? Math.min(distance, travel) / distance : 0;
      knob.style.transform = `translate(${x * scale}px, ${y * scale}px)`;
      const directions = joystickDirections(x / radius, y / radius);
      const nextKeys = new Set(directionKeys.filter(key => directions.includes(key.direction)).map(key => key.code));
      for (const code of stickKeys) if (!nextKeys.has(code)) { runtime.__keyStates.set(code, false); stickKeys.delete(code); }
      for (const code of nextKeys) if (!stickKeys.has(code)) { stickKeys.add(code); pressKey(code); }
      stick.dataset.directions = directionKeys.filter(key => nextKeys.has(key.code)).map(key => key.direction).join(' ');
      for (const [direction, indicator] of indicators) indicator.dataset.pressed = String(directions.includes(direction) && indicator.dataset.available === 'true');
    };
    listen(stick, 'contextmenu', event => event.preventDefault());
    listen(stick, 'pointerdown', event => {
      if (stickPointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); canvas.focus({ preventScroll: true });
      stickPointer = event.pointerId; stick.dataset.active = 'true'; stick.setPointerCapture(event.pointerId); moveStick(event);
    });
    listen(stick, 'pointermove', event => { if (event.pointerId === stickPointer) { event.preventDefault(); moveStick(event); } });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(stick, type, event => { if (event.pointerId === stickPointer) releaseJoystick(); });
  }
  function addButton(kind, code, label) {
    const button = doc.createElement('button'); button.type = 'button'; button.textContent = label;
    button.setAttribute('aria-label', kind === 'key' ? `Tecla ${label}` : label); button.setAttribute('aria-pressed', 'false');
    button.dataset.kind = kind;
    if (kind === 'key' && code === 32) button.dataset.primary = 'true';
    actions.append(button);
    listen(button, 'contextmenu', event => event.preventDefault());
    listen(button, 'pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault(); canvas.focus({ preventScroll: true });
      button.setPointerCapture(event.pointerId);
      held.set(event.pointerId, { id: `${kind}:${code}`, kind, code, button }); button.setAttribute('aria-pressed', 'true');
      if (kind === 'key') {
        pressKey(code);
      } else runtime.__mouseButtons[code] = true;
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(button, event, e => release(e.pointerId));
  }
  const directionCodes = new Set(directionKeys.map(key => key.code));
  for (const key of profile.keys) if (!directionCodes.has(key.code)) addButton('key', key.code, key.label);
  if (profile.mouse) for (const button of profile.mouseButtons) addButton('mouse', button, ['Clique', 'Clique direito', 'Clique do meio'][button]);
  if (profile.relativeMouse || profile.mousePosition) {
    const side = doc.createElement('div'); side.className = 'touch-mouse-side'; layout.append(side); side.append(actions);
    const mouseStick = doc.createElement('div'); mouseStick.className = 'touch-joystick touch-mouse-joystick';
    mouseStick.setAttribute('role', 'group'); mouseStick.setAttribute('aria-label', 'Joystick do mouse');
    mouseStick.setAttribute('aria-description', 'Arraste para mover o mouse nos eixos X e Y. Solte para parar.');
    const mouseKnob = doc.createElement('span'); mouseKnob.className = 'touch-joystick-knob'; mouseStick.append(mouseKnob); side.append(mouseStick);
    let pointer = null, x = 0, y = 0, frame = null, lastTime = 0, remainderX = 0, remainderY = 0;
    const tick = time => {
      const dt = Math.min((time - lastTime) / 1000, .05); lastTime = time;
      if (profile.relativeMouse) {
        runtime.__mouseDeltaX += x * 600 * dt; runtime.__mouseDeltaY += y * 600 * dt;
      } else {
        // Mouse.posicao_x/y promise integer coordinates, including for array indices.
        const dx = x * 600 * dt + remainderX, dy = y * 600 * dt + remainderY;
        remainderX = dx - Math.trunc(dx); remainderY = dy - Math.trunc(dy);
        runtime.__mouseX = Math.max(0, Math.min(runtime.bufferWidth - 1, runtime.__mouseX + Math.trunc(dx)));
        runtime.__mouseY = Math.max(0, Math.min(runtime.bufferHeight - 1, runtime.__mouseY + Math.trunc(dy)));
      }
      frame = target.requestAnimationFrame(tick);
    };
    releaseMouseStick = () => {
      if (frame !== null) target.cancelAnimationFrame(frame);
      frame = null; pointer = null; x = 0; y = 0; remainderX = 0; remainderY = 0;
      mouseStick.dataset.active = 'false'; mouseKnob.style.transform = 'translate(0px, 0px)';
    };
    releaseMouseStick();
    const move = event => {
      const rect = mouseStick.getBoundingClientRect(), radius = rect.width / 2;
      x = (event.clientX - rect.left - radius) / radius; y = (event.clientY - rect.top - radius) / radius;
      const distance = Math.hypot(x, y), scale = Math.max(1, distance);
      x /= scale; y /= scale;
      if (distance < .2) { x = 0; y = 0; }
      const travel = radius - mouseKnob.offsetWidth / 2 - 5;
      mouseKnob.style.transform = `translate(${x * travel}px, ${y * travel}px)`;
    };
    listen(mouseStick, 'contextmenu', event => event.preventDefault());
    listen(mouseStick, 'pointerdown', event => {
      if (pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); canvas.focus({ preventScroll: true }); pointer = event.pointerId;
      mouseStick.setPointerCapture(pointer); mouseStick.dataset.active = 'true';
      if (profile.relativeMouse) runtime.__touchMouseCaptured = !!runtime.__captureRequested;
      move(event); lastTime = target.performance.now(); frame = target.requestAnimationFrame(tick);
    });
    listen(mouseStick, 'pointermove', event => { if (event.pointerId === pointer) { event.preventDefault(); move(event); } });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(mouseStick, type, event => { if (event.pointerId === pointer) releaseMouseStick(); });
  }
  const previousTouchAction = canvas.style.touchAction;
  if (profile.mouse) {
    canvas.style.touchAction = 'none';
    const position = event => {
      const rect = canvas.getBoundingClientRect();
      runtime.__mouseX = Math.max(0, Math.min(runtime.bufferWidth - 1, Math.floor((event.clientX - rect.left) * runtime.bufferWidth / rect.width)));
      runtime.__mouseY = Math.max(0, Math.min(runtime.bufferHeight - 1, Math.floor((event.clientY - rect.top) * runtime.bufferHeight / rect.height)));
    };
    listen(canvas, 'pointerdown', event => {
      if (event.pointerType === 'mouse') return;
      event.preventDefault(); canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
      gestures.set(event.pointerId, { x: event.clientX, y: event.clientY }); position(event);
      if (profile.relativeMouse) runtime.__touchMouseCaptured = !!runtime.__captureRequested;
      else runtime.__mouseButtons[0] = true;
    });
    listen(canvas, 'pointermove', event => {
      const last = gestures.get(event.pointerId); if (!last) return;
      event.preventDefault();
      if (profile.relativeMouse) {
        const rect = canvas.getBoundingClientRect();
        runtime.__mouseDeltaX += (event.clientX - last.x) * runtime.bufferWidth / rect.width;
        runtime.__mouseDeltaY += (event.clientY - last.y) * runtime.bufferHeight / rect.height;
        last.x = event.clientX; last.y = event.clientY;
      } else position(event);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(canvas, event, e => {
      if (!gestures.delete(e.pointerId)) return;
      if (!gestures.size && ![...held.values()].some(item => item.kind === 'mouse' && item.code === 0)) runtime.__mouseButtons[0] = false;
    });
  }
  listen(target, 'blur', reset);
  listen(doc, 'visibilitychange', () => { if (doc.hidden) reset(); });
  return () => { reset(); listeners.forEach(remove => remove()); canvas.style.touchAction = previousTouchAction; root.remove(); };
}
