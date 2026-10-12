import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRepositoryHandler, normalizePath } from '../server/repository.js';

test('repositório persiste texto e binário entre instâncias, lista e exclui arquivos', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'portugol-files-'));
  let server;
  async function start() {
    server = http.createServer(createRepositoryHandler(directory));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return 'http://127.0.0.1:' + server.address().port + '/api/files';
  }
  const close = () => new Promise(resolve => server.close(resolve));
  try {
    let url = await start();
    const binary = Buffer.from([0, 255, 128, 42]);
    assert.equal((await fetch(url + '?path=imagens/fundo.png', { method: 'PUT', body: binary, headers: { 'Content-Type': 'image/png' } })).status, 204);
    assert.equal((await fetch(url + '?path=saida.txt', { method: 'PUT', body: 'Olá, aluno!' })).status, 204);
    await close(); url = await start();
    const files = await (await fetch(url)).json();
    assert.deepEqual(files.map(f => f.path), ['imagens/fundo.png', 'saida.txt']);
    assert.equal(files[0].type, 'image/png');
    assert.deepEqual(Buffer.from(await (await fetch(url + '?path=imagens/fundo.png')).arrayBuffer()), binary);
    assert.equal(await (await fetch(url + '?path=./saida.txt')).text(), 'Olá, aluno!');
    assert.equal((await fetch(url + '?path=saida.txt', { method: 'DELETE' })).status, 204);
    assert.equal((await fetch(url + '?path=saida.txt')).status, 404);
    assert.equal((await fetch(url + '?path=../escape.txt', { method: 'PUT', body: 'x' })).status, 400);
  } finally { await close(); await rm(directory, { recursive: true, force: true }); }
});

test('caminhos virtuais rejeitam traversal e caminhos absolutos', () => {
  for (const name of ['../segredo', '/absoluto', 'C:\\segredo', 'a/../b', 'a//b', '__proto__/../x', '']) assert.throws(() => normalizePath(name));
  assert.equal(normalizePath('.\\imagens\\fundo.png'), 'imagens/fundo.png');
});
