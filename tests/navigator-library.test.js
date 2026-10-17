import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installNavigatorLibrary } from '../libraries/navigator.js';
import { PortugolRuntime, transpilePortugol } from '../runtime/index.js';
import contracts from '../libraries/contracts/index.js';
import { analyzeCode } from '../ide/src/services/analysis.js';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';
import { portugolCompletions } from '../ide/src/editor/portugol.js';

function setup(navigator = {}, properties = {}) {
  const view = { navigator, ...properties }, runtime = { canvas: { ownerDocument: { defaultView: view } } };
  installNavigatorLibrary(runtime);
  return { runtime, view, library: runtime.Navegador };
}

test('distingue celulares, tablets, computadores e seus sistemas sem usar a largura', () => {
  for (const [userAgent, platform, maxTouchPoints, os, phone, tablet] of [
    ['Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36', 'Linux arm', 5, 'Android', true, false],
    ['Mozilla/5.0 (Linux; Android 14) Chrome/130 Safari/537.36', 'Linux arm', 5, 'Android', false, true],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18 Safari/604', 'iPhone', 5, 'iOS', true, false],
    ['Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) Version/18 Safari/604', 'iPad', 5, 'iPadOS', false, true],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Version/18 Safari/604', 'MacIntel', 5, 'iPadOS', false, true],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Version/18 Safari/604', 'MacIntel', 0, 'macOS', false, false],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130', 'Win32', 10, 'Windows', false, false],
    ['Mozilla/5.0 (X11; CrOS x86_64) Chrome/130', 'Linux x86_64', 0, 'ChromeOS', false, false],
    ['Mozilla/5.0 (X11; Linux x86_64) Firefox/130', 'Linux x86_64', 0, 'Linux', false, false],
    ['Unidentified browser', '', 0, 'Desconhecido', false, false],
  ]) {
    const { library } = setup({ userAgent, platform, maxTouchPoints }, { innerWidth: 320, innerHeight: 600 });
    assert.equal(library.obter_sistema_operacional(), os, userAgent);
    assert.equal(library.eh_celular(), phone, userAgent);
    assert.equal(library.eh_tablet(), tablet, userAgent);
  }
});

test('nomes específicos precedem tokens Chrome e Safari compartilhados', () => {
  for (const [userAgent, expected] of [
    ['Chrome/130 Safari/537.36 Edg/130', 'Edge'], ['CriOS/130 Mobile Safari/604 EdgiOS/130', 'Edge'],
    ['Chrome/130 Safari/537.36 OPR/114', 'Opera'], ['Chrome/130 Safari/537.36 SamsungBrowser/26', 'Samsung Internet'],
    ['Version/18 Mobile Safari/604 FxiOS/130', 'Firefox'], ['Firefox/130', 'Firefox'],
    ['Chrome/130 Safari/537.36', 'Chrome'], ['CriOS/130 Mobile Safari/604', 'Chrome'],
    ['Version/18 Mobile Safari/604', 'Safari'], ['', 'Desconhecido'],
  ]) assert.equal(setup({ userAgent }).library.obter_nome(), expected, userAgent);
});

test('Client Hints de baixa entropia funcionam sem agente tradicional e ignoram marcas artificiais', () => {
  const { library } = setup({ userAgentData: { brands: [{ brand: 'Not;A Brand' }, { brand: 'Chromium' }, { brand: 'Microsoft Edge' }], platform: 'Android', mobile: true } });
  assert.equal(library.obter_nome(), 'Edge');
  assert.equal(library.obter_sistema_operacional(), 'Android');
  assert.equal(library.eh_celular(), true);
  assert.equal(library.eh_tablet(), false);
});

test('consultas de recursos e medidas acompanham mudanças da janela e não confundem toque com celular', () => {
  const pointers = new Set(['(any-pointer: fine)']);
  const navigator = { userAgent: 'Windows NT 10.0', maxTouchPoints: 5, onLine: true, language: 'pt-BR' };
  const { view, library } = setup(navigator, { innerWidth: 1200, innerHeight: 800, screen: { width: 1920, height: 1080 }, devicePixelRatio: 1.5, matchMedia: query => ({ matches: pointers.has(query) }) });
  assert.equal(library.suporta_toque(), true);
  assert.equal(library.possui_mouse(), true);
  assert.equal(library.eh_celular(), false);
  assert.equal(library.largura_janela(), 1200);
  assert.equal(library.altura_janela(), 800);
  assert.equal(library.largura_tela(), 1920);
  assert.equal(library.altura_tela(), 1080);
  assert.equal(library.densidade_pixels(), 1.5);
  assert.equal(library.obter_idioma(), 'pt-BR');
  assert.equal(library.obter_orientacao(), 'paisagem');
  view.innerWidth = 390; view.innerHeight = 844; view.devicePixelRatio = 2;
  navigator.onLine = false; navigator.language = 'en-US'; navigator.maxTouchPoints = 0;
  pointers.clear(); pointers.add('(any-pointer: coarse)');
  assert.equal(library.obter_orientacao(), 'retrato');
  assert.equal(library.largura_janela(), 390);
  assert.equal(library.densidade_pixels(), 2);
  assert.equal(library.esta_online(), false);
  assert.equal(library.obter_idioma(), 'en-US');
  assert.equal(library.possui_mouse(), false);
  assert.equal(library.suporta_toque(), true);
});

test('mover o canvas para outra janela muda a origem das consultas', () => {
  const { runtime, library } = setup({}, { innerWidth: 1200, innerHeight: 800 });
  runtime.canvas.ownerDocument = { defaultView: { navigator: { language: 'es' }, innerWidth: 400, innerHeight: 700 } };
  assert.equal(library.largura_janela(), 400);
  assert.equal(library.obter_idioma(), 'es');
});

test('sem navegador, todas as funções retornam valores seguros e respeitam os contratos', () => {
  const runtime = new PortugolRuntime(null, null);
  const defaults = { cadeia: 'Desconhecido', logico: false, inteiro: 0, real: 1 };
  for (const [name, contract] of Object.entries(contracts.Navegador)) {
    assert.equal(typeof runtime.Navegador[name], 'function', name);
    assert.equal(runtime.Navegador[name](), name === 'obter_idioma' ? '' : defaults[contract.type], name);
    assert.equal(contract.parameters.length, 0);
    assert.ok(contract.description && contract.returns);
  }
  runtime.destroy();
});

test('compilador verifica tipos, parâmetros e nomes; exemplo executa com alias', async () => {
  const source = readFileSync(new URL('../public/exemplos/web/ambiente_navegador.por', import.meta.url), 'utf8');
  assert.deepEqual(analyzeCode(source).diagnostics, []);
  const runtime = new PortugolRuntime(null, null), output = [];
  runtime.setPresentationWindow({ navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36', language: 'pt-BR', maxTouchPoints: 5, onLine: true }, innerWidth: 390, innerHeight: 844 });
  runtime.escreva = (...args) => output.push(args.map(value => runtime.stringify(value)).join(''));
  await new Function('__runtime', transpilePortugol(source))(runtime);
  assert.match(output.join(''), /Sistema operacional: Android/);
  assert.match(output.join(''), /Celular: verdadeiro/);
  assert.match(output.join(''), /Janela: 390 x 844/);
  runtime.destroy();
  for (const body of ['inteiro numero = nav.obter_nome()', 'nav.eh_celular(1)', 'nav.funcao_inexistente()']) {
    const code = `programa { inclua biblioteca Navegador --> nav funcao inicio() { ${body} } }`;
    assert.ok(analyzeCode(code).diagnostics.some(item => item.severity === 'error'), body);
  }
});

test('editor sugere a biblioteca e seus métodos usando o alias', () => {
  for (const [source, expected] of [
    ['programa {\n inclua biblioteca Nav', 'Navegador'],
    ['programa {\n inclua biblioteca Navegador --> nav\n funcao inicio() {\n nav.', 'eh_celular'],
  ]) {
    const state = EditorState.create({ doc: source });
    const completions = portugolCompletions(new CompletionContext(state, source.length, true));
    assert.ok(completions.options.some(option => option.label === expected), expected);
  }
});

test('guia contém o mesmo exemplo do catálogo e sobrevive à reimportação', () => {
  const source = readFileSync(new URL('../public/exemplos/web/ambiente_navegador.por', import.meta.url), 'utf8').trim();
  const article = readFileSync(new URL('../public/ajuda/topicos/web/ambiente_navegador.html', import.meta.url), 'utf8');
  const example = article.match(/<pre data-example="complete"><code>([\s\S]*?)<\/code>/)[1].replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
  assert.equal(example, source);
  for (const name of Object.keys(contracts.Navegador)) assert.ok(article.includes(name + '()'), name);
  for (const path of ['../scripts/web-examples.json', '../public/exemplos/index.json']) assert.ok(JSON.parse(readFileSync(new URL(path, import.meta.url))).some(item => item.id === 'web_ambiente_navegador'));
  for (const path of ['../scripts/web-help.json', '../public/ajuda/index.json']) assert.ok(JSON.parse(readFileSync(new URL(path, import.meta.url))).some(item => item.path.endsWith('/web/ambiente_navegador.html')));
  const sync = readFileSync(new URL('../scripts/sync-library-contracts.js', import.meta.url), 'utf8');
  assert.ok(sync.includes('contracts.Navegador = webBrowserContracts;'));
});
