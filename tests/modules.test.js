import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { tokenize, lexicalDiagnostics, parseProgram, semanticDiagnostics, analyzeTokens, transpilePortugol } from '../core/index.js';
import contracts from '../libraries/index.js';
import * as runtime from '../runtime/index.js';
import * as legacyCompiler from '../js/compiler.js';
import * as legacyTranspiler from '../js/transpiler.js';
import * as legacyRuntime from '../js/runtime.js';
import legacyContracts from '../js/library-contracts.js';

test('etapas da linguagem podem ser usadas separadamente, sem carregar a IDE', () => {
  const tokens = tokenize('programa { funcao inicio() { inteiro valor = "texto" } }');
  assert.deepEqual(lexicalDiagnostics(tokens), []);
  const program = parseProgram(tokens);
  assert.equal(program.functions[0].name, 'inicio');
  const diagnostics = semanticDiagnostics(program);
  assert.ok(diagnostics.some(item => item.severity === 'error'));
  assert.throws(() => transpilePortugol(tokens.map(token => token.value).join('')), error =>
    error.diagnostics.some(item => item.code === diagnostics[0].code));
  assert.ok(lexicalDiagnostics(tokenize('@')).some(item => item.severity === 'error'));
  assert.throws(() => parseProgram(tokenize('programa { funcao inicio( }')), /esperado|tipo|nome/i);
});

test('API do runtime e reexports antigos preservam a mesma implementação', () => {
  assert.equal(runtime.tokenize, tokenize);
  assert.equal(runtime.transpilePortugol, transpilePortugol);
  assert.equal(legacyCompiler.analyzeTokens, analyzeTokens);
  assert.equal(legacyCompiler.parseProgram, parseProgram);
  assert.equal(legacyTranspiler.transpilePortugol, transpilePortugol);
  assert.equal(legacyRuntime.PortugolRuntime, runtime.PortugolRuntime);
  assert.equal(legacyContracts, contracts);
  assert.equal(typeof runtime.createProjectFiles, 'function');
  assert.equal(typeof runtime.mountProject, 'function');
});

test('core, bibliotecas e runtime não dependem da IDE; core só usa contratos e validação das bibliotecas', async () => {
  const root = new URL('../', import.meta.url);
  async function inspect(directory) {
    for (const entry of await readdir(new URL(directory, root), { withFileTypes: true })) {
      const file = directory + entry.name;
      if (entry.isDirectory()) { await inspect(file + '/'); continue; }
      if (!file.endsWith('.js')) continue;
      const source = await readFile(new URL(file, root), 'utf8');
      for (const match of source.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)(['"])([^'"]+)\1/g)) {
        const specifier = match[2];
        assert.ok(specifier.startsWith('.'), `${file}: dependência externa ${specifier}`);
        const target = new URL(specifier, new URL(file, root)).href.slice(root.href.length);
        assert.ok(!target.startsWith('ide/') && !target.startsWith('js/'), `${file} importa ${target}`);
        if (file.startsWith('core/')) {
          assert.ok(!target.startsWith('runtime/'), `${file} importa ${target}`);
          if (target.startsWith('libraries/')) assert.ok(target.startsWith('libraries/contracts/') || target === 'libraries/validation.js', `${file} importa implementação ${target}`);
        }
        if (file.startsWith('core/lexical/') || file.startsWith('core/syntax/')) {
          assert.ok(!target.startsWith('core/transpilation/') && target !== 'core/compiler.js', `${file} importa geração de código: ${target}`);
        }
      }
    }
  }
  for (const directory of ['core/', 'libraries/', 'runtime/']) await inspect(directory);
});
