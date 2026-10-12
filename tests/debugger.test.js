import test from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionDebugger } from '../runtime/core/debugger.js';
import { PortugolRuntime } from '../runtime/core/runtime.js';
import { transpilePortugol } from '../runtime/core/transpiler.js';
import { analyzeCode } from '../src/services/analysis.js';

test('depuração entra em chamadas, observa valores e avança sobre funções', async () => {
  const source = 'programa { funcao inteiro soma(inteiro n) { retorne n + 1 } funcao inicio() { inteiro a = 2 a = soma(a) a++ } }';
  const runtime = new PortugolRuntime(null, null), stops = [];
  runtime.debugger = new ExecutionDebugger({ onPause(state) {
    stops.push(state);
    queueMicrotask(() => runtime.debugger.resume(source.slice(state.from).startsWith('a = soma') ? 'over' : 'into'));
  } });
  runtime.inspect = (...args) => runtime.debugger.inspect(...args);
  try {
    await new Function('__runtime', transpilePortugol(source, { inspect: true, debug: true }))(runtime);
    assert.ok(stops.some(stop => source.slice(stop.from).startsWith('a++') && stop.frames.at(-1).symbols.some(symbol => symbol.name === 'a' && symbol.value === 3)));
    assert.ok(!stops.some(stop => stop.frames.at(-1).name === 'soma'));
  } finally { runtime.destroy(); }
});

test('pontos de parada reaparecem em laços e parar libera uma execução suspensa', async () => {
  const source = 'programa { funcao inicio() { inteiro a = 0 enquanto (a < 3) { a++ } } }';
  const runtime = new PortugolRuntime(null, null), stops = [];
  runtime.debugger = new ExecutionDebugger({ onPause(state) { stops.push(state); queueMicrotask(() => stops.length === 5 ? runtime.abort() : runtime.debugger.resume('into')); } });
  runtime.inspect = (...args) => runtime.debugger.inspect(...args);
  try {
    await assert.rejects(new Function('__runtime', transpilePortugol(source, { inspect: true, debug: true }))(runtime), /EXECUCAO_INTERROMPIDA/);
    assert.equal(stops.length, 5);
    assert.ok(stops.filter(stop => source.slice(stop.from).startsWith('enquanto')).length >= 2);
  } finally { runtime.destroy(); }
});

test('correções propostas eliminam truncamento e variável sem inicialização', () => {
  for (const source of ['programa { funcao inicio() { inteiro a = 3.45 escreva(a) } }', 'programa { funcao inicio() { inteiro a escreva(a) } }']) {
    const diagnostic = analyzeCode(source).diagnostics.find(item => item.fixes?.length);
    assert.ok(diagnostic);
    const change = diagnostic.fixes[0].changes[0];
    const fixed = source.slice(0, change.from) + change.insert + source.slice(change.to);
    assert.equal(analyzeCode(fixed).diagnostics.length, 0);
  }
});
