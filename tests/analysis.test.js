import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCode } from '../src/services/analysis.js';
import { transpilePortugol } from '../runtime/core/transpiler.js';
import { PortugolRuntime } from '../runtime/core/runtime.js';

test('diagnósticos localizam símbolos desconhecidos e avisam sobre variáveis sem uso', () => {
  const source = 'programa { funcao inicio() { inteiro sobra = 1 escreva(desconhecida) } }';
  const result = analyzeCode(source);
  assert.equal(result.diagnostics.find(d => d.severity === 'error').from, source.indexOf('desconhecida'));
  assert.equal(result.diagnostics.find(d => d.severity === 'warning').from, source.indexOf('sobra'));
  assert.equal(result.symbols[0].children[0].name, 'sobra');
});

test('comentários e textos não contam como uso; programa sem inicio apresenta erro', () => {
  const result = analyzeCode('programa { inteiro nome = 1 // nome\n funcao outra() { escreva("nome") } }');
  assert.ok(result.diagnostics.some(d => d.severity === 'warning' && d.message.includes('nome')));
  assert.ok(result.diagnostics.some(d => d.severity === 'error' && d.message.includes('inicio')));
});

test('inspeção preserva globais, laços, referências, escopos e retorno', async () => {
  const source = `programa {
    inteiro a = 1
    inteiro b = 2
    funcao inteiro soma(inteiro &valor) { valor += 3 retorne valor }
    funcao inicio() {
      inteiro resultado = soma(a)
      para (inteiro i = 0; i < 3; i++) { resultado += i }
      se (verdadeiro) { inteiro resultado = 99 resultado++ }
      resultado += b
    }
  }`;
  const runtime = new PortugolRuntime(null, null), snapshots = [];
  runtime.inspect = (scope, from, symbols) => snapshots.push({ scope, from, symbols: structuredClone(symbols) });
  try {
    await new Function('__runtime', transpilePortugol(source, { inspect: true }))(runtime);
    const last = snapshots.at(-1).symbols;
    assert.equal(last.find(s => s.name === 'a').value, 4);
    assert.equal(last.find(s => s.name === 'resultado').value, 9);
    assert.ok(snapshots.some(s => s.scope === 'soma' && s.symbols.some(v => v.name === 'valor' && v.value === 4)));
    assert.ok(snapshots.some(s => s.symbols.some(v => v.name === 'i' && v.value === 2)));
  } finally { runtime.destroy(); }
});


test('real para inteiro avisa em declaração, atribuição, expressão, retorno e argumento', () => {
  const source = `programa {
    funcao inteiro converte(real r) { retorne r }
    funcao recebe(inteiro n) { escreva(n) }
    funcao inicio() {
      inteiro a = 3.45
      real r = 2.5
      a = r
      a += 0.5
      inteiro b = r + 1
      recebe(4.5)
      escreva(a, b, converte(r))
    }
  }`;
  const warnings = analyzeCode(source).diagnostics.filter(d => d.message.includes('parte decimal'));
  assert.equal(warnings.length, 6);
  assert.equal(source.slice(warnings.find(d => d.from === source.indexOf('3.45')).from, warnings.find(d => d.from === source.indexOf('3.45')).to), '3.45');
});

test('conversões sem perda e variável real não produzem avisos de truncamento', () => {
  const source = 'programa { funcao inicio() { inteiro a = 3 real b = 3.45 b = a escreva(a, b) } }';
  assert.ok(analyzeCode(source).diagnostics.every(d => d.severity === 'warning' && d.message.includes('será convertido para “real”')));
});
