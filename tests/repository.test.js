import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePath } from '../ide/src/services/repository.js';

test('caminhos locais rejeitam traversal e caminhos absolutos', () => {
  for (const name of ['../segredo', '/absoluto', 'C:\\segredo', 'a/../b', '__proto__/../x', '']) assert.throws(() => normalizePath(name));
  assert.equal(normalizePath('.\\imagens\\fundo.png'), 'imagens/fundo.png');
  assert.equal(normalizePath('a//b'), 'a/b');
});
