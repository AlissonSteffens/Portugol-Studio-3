import test from 'node:test';
import assert from 'node:assert/strict';
import { presentationMethods } from '../runtime/presentation.js';

function frameWindow() {
  let next = 0;
  const callbacks = new Map();
  return {
    callbacks,
    requestAnimationFrame(callback) { callbacks.set(++next, callback); return next; },
    cancelAnimationFrame(id) { callbacks.delete(id); },
    frame() { for (const callback of [...callbacks.values()]) callback(); },
  };
}

test('um frame já pendente acompanha a aba gráfica e pode voltar ao editor', async () => {
  const editor = frameWindow(), popup = frameWindow();
  const runtime = { ...presentationMethods, canvas: { ownerDocument: { defaultView: editor } } };
  const first = runtime.waitForFrame();
  assert.equal(editor.callbacks.size, 1);
  runtime.setPresentationWindow(popup);
  assert.equal(editor.callbacks.size, 0);
  assert.equal(popup.callbacks.size, 1);
  popup.frame(); await first;
  const second = runtime.waitForFrame();
  runtime.setPresentationWindow(editor);
  assert.equal(popup.callbacks.size, 0);
  editor.frame(); await second;
  assert.equal(runtime.__presentationWaits.size, 0);
});

test('parar libera frames e esperas longas imediatamente', async () => {
  const target = frameWindow(), runtime = { ...presentationMethods, __presentationWindow: target };
  const frame = runtime.waitForFrame();
  for (const pending of runtime.__presentationWaits) pending.abort();
  await assert.rejects(frame, /EXECUCAO_INTERROMPIDA/);
  assert.equal(target.callbacks.size, 0);
  runtime.setPresentationWindow(globalThis);
  const delay = runtime.waitForDelay(60_000);
  for (const pending of runtime.__presentationWaits) pending.abort();
  await assert.rejects(delay, /EXECUCAO_INTERROMPIDA/);
  assert.equal(runtime.__presentationWaits.size, 0);
});
