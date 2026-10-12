import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transpilePortugol } from '../runtime/index.js';
import { PortugolRuntime } from '../runtime/index.js';
import { repairSphere } from '../scripts/sphere-fix.js';

test('iluminação da esfera depende da orientação e mantém canais válidos', async () => {
  const source = await readFile('public/exemplos/bibliotecas/graficos/sphere.por', 'utf8');
  const normals = [[-.4, .65, -1], [.4, -.65, 1], [-4, 6.5, -10], [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, -1]];
  const body = normals.map(normal => `escreva(cor_face(${normal.map(value => Number.isInteger(value) ? value + '.0' : value).join(',')}), "\\n")`).join('\n');
  const program = source.replace(/funcao inicio\(\)\s*\{[\s\S]*?\}/, 'funcao inicio() { ' + body + ' }');
  const runtime = new PortugolRuntime(null, null);
  const results = [];
  runtime.escreva = async value => { results.push(value >>> 0); };
  await new Function('__runtime', transpilePortugol(program))(runtime);
  const shades = results.map(color => color & 255);
  assert.ok(shades[0] >= 254);
  assert.equal(shades[1], 45);
  assert.equal(shades[0], shades[2], 'O comprimento da normal não deve alterar a intensidade.');
  for (const color of results) {
    assert.equal(color >>> 24, 255);
    assert.equal((color >>> 16) & 255, color & 255);
    assert.equal((color >>> 8) & 255, color & 255);
  }
  assert.equal(repairSphere(source), source, 'Sincronizar novamente não deve duplicar a correção.');
  runtime.destroy();
});
