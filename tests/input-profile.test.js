import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { detectInputProfile } from '../runtime/input/profile.js';
import { analyzeCode } from '../ide/src/services/analysis.js';

test('detecta aliases, setas, ações, códigos numéricos e mouse juntos', () => {
  const profile = detectInputProfile(`programa {
    inclua biblioteca Teclado --> t
    inclua biblioteca Mouse --> m
    funcao inicio() {
      t.tecla_pressionada(t.TECLA_SETA_ACIMA)
      t.tecla_pressionada(t.TECLA_ESPACO)
      t.tecla_pressionada(65)
      m.botao_pressionado(m.BOTAO_DIREITO)
      m.posicao_x()
    }
  }`);
  assert.deepEqual(profile.keys.map(k => k.code), [38, 32, 65]);
  assert.equal(profile.keys[0].direction, 'up');
  assert.equal(profile.mouse, true);
  assert.deepEqual(profile.mouseButtons, [1]);
  assert.equal(profile.relativeMouse, false);
  assert.equal(profile.mousePosition, true);
});

test('comentários, literais e importações sem uso não criam botões', () => {
  const profile = detectInputProfile(`programa {
    inclua biblioteca Teclado --> t
    inclua biblioteca Mouse
    // t.TECLA_SETA_ACIMA Mouse.posicao_x()
    /* Mouse.capturar_cursor() */
    funcao inicio() { escreva("t.TECLA_ESPACO Mouse.posicao_x()") }
  }`);
  assert.deepEqual(profile, { keys: [], mouse: false, relativeMouse: false, mousePosition: false, mouseButtons: [] });
});

test('ler_tecla sem tecla explícita permite continuar e mouse relativo é reconhecido', () => {
  const profile = detectInputProfile(`inclua biblioteca Teclado inclua biblioteca Mouse
    Teclado.ler_tecla() Mouse.capturar_cursor() Mouse.movimento_x()`);
  assert.deepEqual(profile.keys.map(k => k.code), [10]);
  assert.equal(profile.relativeMouse, true);
  assert.equal(profile.mousePosition, false);
  assert.deepEqual(profile.mouseButtons, [0]);
});

test('jogos de bolso compilam sem diagnósticos e aparecem nos dois catálogos', () => {
  for (const name of ['pista', 'arena', 'frutas']) {
    const source = readFileSync(new URL(`../public/exemplos/web/${name}_mobile.por`, import.meta.url), 'utf8');
    assert.deepEqual(analyzeCode(source).diagnostics, [], name);
    for (const path of ['../public/exemplos/index.json', '../scripts/web-examples.json']) {
      const entries = JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
      assert.equal(entries.filter(item => item.id === `web_${name}_mobile`).length, 1);
    }
  }
});

test('Missão Órbita compila sem diagnósticos e demonstra todos os controles móveis', () => {
  const source = readFileSync(new URL('../public/exemplos/web/missao_mobile.por', import.meta.url), 'utf8');
  assert.deepEqual(analyzeCode(source).diagnostics, []);
  const profile = detectInputProfile(source);
  assert.deepEqual(profile.keys.map(k => k.code).sort((a, b) => a - b), [10, 32, 37, 38, 39, 40]);
  assert.equal(profile.mouse, true);
  for (const path of ['../public/exemplos/index.json', '../scripts/web-examples.json']) {
    const entries = JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
    assert.equal(entries.filter(item => item.id === 'web_missao_mobile').length, 1);
  }
});
