import test from 'node:test';
import assert from 'node:assert/strict';
import { installMouseCapture } from '../runtime/core/mouse-capture.js';

function setup(request) {
  const doc = { pointerLockElement: null, exitPointerLock() { this.pointerLockElement = null; } };
  const canvas = { ownerDocument: doc, focus() {}, requestPointerLock: request || (() => { doc.pointerLockElement = canvas; return Promise.resolve(); }) };
  const runtime = { canvas, Mouse: {} }; installMouseCapture(runtime);
  return { runtime, doc, canvas };
}

test('captura começa no clique e movimentos relativos são consumidos uma vez', async () => {
  const { runtime, doc } = setup();
  runtime.Mouse.capturar_cursor();
  assert.equal(doc.pointerLockElement, null);
  assert.equal(runtime.__requestMouseCapture(), true);
  await Promise.resolve();
  assert.equal(runtime.Mouse.cursor_capturado(), true);
  assert.equal(runtime.__requestMouseCapture(), false);
  runtime.__mouseDeltaX = 35; runtime.__mouseDeltaY = -12;
  assert.equal(runtime.Mouse.movimento_x(), 35); assert.equal(runtime.Mouse.movimento_x(), 0);
  assert.equal(runtime.Mouse.movimento_y(), -12); assert.equal(runtime.Mouse.movimento_y(), 0);
  runtime.Mouse.soltar_cursor();
  assert.equal(runtime.Mouse.cursor_capturado(), false);
});

test('captura atrasada é liberada quando o programa já foi interrompido', async () => {
  let grant;
  const { runtime, doc, canvas } = setup(() => new Promise(resolve => { grant = resolve; }));
  runtime.Mouse.capturar_cursor(); runtime.__requestMouseCapture();
  runtime.__aborted = true; runtime.__releaseMouseCapture();
  doc.pointerLockElement = canvas; grant(); await Promise.resolve();
  assert.equal(doc.pointerLockElement, null);
});

test('soltar cursor respeita a janela atual e não libera o cursor de outro canvas', () => {
  const { runtime, doc } = setup();
  const another = {}; doc.pointerLockElement = another;
  runtime.Mouse.soltar_cursor();
  assert.equal(doc.pointerLockElement, another);
  const popup = { pointerLockElement: runtime.canvas, exitPointerLock() { this.pointerLockElement = null; } };
  runtime.canvas.ownerDocument = popup; runtime.Mouse.soltar_cursor();
  assert.equal(popup.pointerLockElement, null);
});

test('programas sem canvas podem consultar e liberar o cursor', () => {
  const runtime = { Mouse: {} }; installMouseCapture(runtime);
  assert.equal(runtime.Mouse.cursor_capturado(), false);
  assert.doesNotThrow(() => runtime.Mouse.soltar_cursor());
});
