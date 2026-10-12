import test from 'node:test';
import assert from 'node:assert/strict';
import { PortugolRuntime } from '../runtime/core/runtime.js';
import { transpilePortugol } from '../runtime/core/transpiler.js';
import { ExecutionDebugger } from '../runtime/core/debugger.js';

test('execução rápida amostra variáveis, preserva o valor final e dispensa cálculo de linhas', async () => {
  const source = 'programa { funcao inteiro dobro(inteiro n) { retorne n * 2 } funcao inicio() { inteiro total = 0 para (inteiro i = 0; i < 200; i++) { total += dobro(i) } } }';
  const runtime = new PortugolRuntime(null, null, { inspectionInterval: 1e9 }), snapshots = [];
  runtime.debugger = new ExecutionDebugger({ lineAt: () => { throw new Error('A execução livre não precisa mapear linhas.'); } });
  runtime.debugger.mode = 'continue'; runtime.inspect = (scope, from, symbols) => snapshots.push({ scope, symbols });
  try {
    await new Function('__runtime', transpilePortugol(source, { inspect: true, debug: true }))(runtime);
    assert.ok(snapshots.length <= 3);
    assert.equal(snapshots.at(-1).symbols.find(symbol => symbol.name === 'total').value, 39800);
  } finally { runtime.destroy(); }
});

test('breakpoint em função rápida mantém parâmetros e volta à execução livre', async () => {
  const source = 'programa {\nfuncao inteiro dobro(inteiro n) {\n retorne n * 2\n}\nfuncao inicio() {\n inteiro total = 0\n para (inteiro i = 0; i < 4; i++) { total += dobro(i) }\n}\n}';
  const runtime = new PortugolRuntime(null, null, { inspectionInterval: 1e9 }), pauses = [], snapshots = [];
  runtime.debugger = new ExecutionDebugger({ breakpoints: [3], lineAt: from => source.slice(0, from).split('\n').length, onPause(state) {
    pauses.push(state);
    queueMicrotask(() => { runtime.debugger.breakpoints.clear(); runtime.debugger.resume(); });
  } });
  runtime.debugger.mode = 'continue';
  runtime.inspect = (scope, from, symbols) => { runtime.debugger.inspect(scope, from, symbols); snapshots.push(symbols); };
  try {
    await new Function('__runtime', transpilePortugol(source, { inspect: true, debug: true }))(runtime);
    assert.equal(pauses.length, 1);
    assert.deepEqual(pauses[0].frames.map(frame => frame.name), ['inicio', 'dobro']);
    assert.equal(pauses[0].frames.at(-1).symbols.find(symbol => symbol.name === 'n').value, 0);
    assert.equal(snapshots.at(-1).find(symbol => symbol.name === 'total').value, 12);
  } finally { runtime.destroy(); }
});

test('atalhos de escalares e matrizes preservam limites, referências e posição dos erros', async () => {
  const source = 'programa { funcao aumentar(inteiro &n) { n += 2 } funcao inicio() { inteiro n = 2147483647 inteiro antes = n++ inteiro depois = ++n inteiro matriz[2][2] aumentar(matriz[1][0]) escreva(antes, ",", depois, ",", matriz[1][0]) } }';
  const runtime = new PortugolRuntime(null, null), output = [];
  runtime.escreva = (...args) => output.push(args.join(''));
  try {
    await new Function('__runtime', transpilePortugol(source))(runtime);
    assert.equal(output.join(''), '2147483647,2147483647,2');
    assert.throws(() => runtime.readElement(runtime.array([2], 'inteiro'), 2, false, 15, 19), error => error.code === 'ErroExecucao.ErroIndiceVetorInvalido' && error.from === 15 && error.to === 19);
  } finally { runtime.destroy(); }
});

test('buffers são reutilizados, validam endereços e liberam memória', () => {
  const runtime = new PortugolRuntime(null, null, { maxBufferPixels: 32 });
  try {
    const g = runtime.Graficos, id = g.criar_buffer(4, 4), original = runtime.bufferCanvas;
    g.usar_buffer(id); g.definir_cor(0xff0000); g.limpar(); g.usar_buffer(0);
    assert.equal(runtime.bufferCanvas, original);
    g.desenhar_buffer(0, 0, id); g.desenhar_buffer(1, 1, id);
    assert.throws(() => g.criar_buffer(5, 5), /memória/);
    g.usar_buffer(id); assert.throws(() => g.desenhar_buffer(0, 0, id), /sobre ele mesmo/);
    g.liberar_buffer(id);
    assert.throws(() => g.usar_buffer(id), /já liberado/);
    assert.doesNotThrow(() => g.criar_buffer(4, 4));
  } finally { runtime.destroy(); }
});
