export function installMouseCapture(runtime) {
  runtime.__mouseDeltaX = 0; runtime.__mouseDeltaY = 0;
  runtime.__releaseMouseCapture = (disable = true) => {
    runtime.__touchMouseCaptured = false;
    if (disable) runtime.__captureRequested = false;
    runtime.__capturePending = false;
    runtime.__mouseDeltaX = 0; runtime.__mouseDeltaY = 0;
    const doc = runtime.canvas?.ownerDocument;
    if (runtime.canvas && doc?.pointerLockElement === runtime.canvas) doc.exitPointerLock();
  };
  runtime.__requestMouseCapture = () => {
    const canvas = runtime.canvas;
    if (!runtime.__captureRequested || !canvas?.requestPointerLock || canvas.ownerDocument.pointerLockElement === canvas) return false;
    if (!runtime.__capturePending) {
      runtime.__capturePending = true; canvas.focus();
      try { canvas.requestPointerLock()?.then(() => {
        runtime.__capturePending = false;
        if (runtime.__aborted || !runtime.__captureRequested) runtime.__releaseMouseCapture();
      }, () => { runtime.__capturePending = false; }); }
      catch { runtime.__capturePending = false; }
    }
    return true; // The activation click captures the mouse, rather than mining.
  };
  Object.assign(runtime.Mouse, {
    capturar_cursor() { runtime.__captureRequested = true; },
    soltar_cursor() { runtime.__releaseMouseCapture(); },
    cursor_capturado() { return !!runtime.__touchMouseCaptured || (runtime.canvas?.ownerDocument.pointerLockElement === runtime.canvas && !!runtime.canvas); },
    movimento_x() { const value = Math.round(runtime.__mouseDeltaX); runtime.__mouseDeltaX = 0; return value; },
    movimento_y() { const value = Math.round(runtime.__mouseDeltaY); runtime.__mouseDeltaY = 0; return value; },
  });
}
