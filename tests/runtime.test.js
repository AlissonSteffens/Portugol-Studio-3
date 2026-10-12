import test from 'node:test';
import assert from 'node:assert/strict';
import { PortugolRuntime } from '../js/runtime.js';
import { transpilePortugol } from '../js/transpiler.js';

test('Internet acessa o endereço diretamente e explica bloqueios do navegador', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async url => { calls.push(url); return new Response('Texto remoto'); });
  const runtime = new PortugolRuntime(null, null);
  assert.equal(await runtime.Internet.obter_texto('https://exemplo.test/texto'), 'Texto remoto');
  assert.deepEqual(calls, ['https://exemplo.test/texto']);
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(runtime.Internet.obter_texto('https://exemplo.test/bloqueado'), /CORS/);
  runtime.destroy();
});

test('Portugol escreve e lê arquivos pelo repositório e aguarda imagens reais', async () => {
  const writes = [], image = { width: 7, height: 9 };
  const files = { files: Object.create(null), normalizePath: p => p.replace(/^\.\//, ''), write: (path, text) => writes.push([path, text]), image: async path => { assert.equal(path, 'imagens/teste.png'); return image; } };
  const runtime = new PortugolRuntime(null, null, { files });
  const source = `programa {
    inclua biblioteca Arquivos --> arq
    inclua biblioteca Graficos --> g
    funcao inicio() {
      inteiro arquivo = arq.abrir_arquivo("./saida.txt", arq.MODO_ESCRITA)
      arq.escrever_linha("Olá!", arquivo)
      arq.fechar_arquivo(arquivo)
      inteiro imagem = g.carregar_imagem("imagens/teste.png")
    }
  }`;
  await new Function('__runtime', transpilePortugol(source))(runtime);
  assert.equal(files.files['saida.txt'], 'Olá!');
  assert.deepEqual(writes.at(-1), ['saida.txt', 'Olá!']);
  assert.equal(runtime.__images.get(1), image);
  const handle = runtime.Arquivos.abrir_arquivo('saida.txt', 0);
  assert.equal(runtime.Arquivos.ler_linha(handle), 'Olá!');
  assert.throws(() => runtime.Arquivos.escrever_linha('não', handle), /leitura/);
  assert.throws(() => runtime.Arquivos.abrir_arquivo('ausente.txt', 0), /não encontrado/);
  runtime.destroy();
});

test('acrescentar preserva conteúdo e apagar notifica persistência', () => {
  const removed = [];
  const runtime = new PortugolRuntime(null, null, { files: { files: { 'saida.txt': 'primeira' }, write() {}, remove(path) { removed.push(path); } } });
  const handle = runtime.Arquivos.abrir_arquivo('saida.txt', 2);
  runtime.Arquivos.escrever_linha('segunda', handle);
  assert.equal(runtime.__vfs['saida.txt'], 'primeira\nsegunda');
  runtime.Arquivos.apagar_arquivo('saida.txt');
  assert.equal(runtime.Arquivos.arquivo_existe('saida.txt'), false);
  assert.deepEqual(removed, ['saida.txt']);
  runtime.destroy();
});
