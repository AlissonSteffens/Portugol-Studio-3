import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyzeCode } from '../src/services/analysis.js';
import { transpilePortugol } from '../runtime/core/transpiler.js';
import { PortugolRuntime } from '../runtime/core/runtime.js';

const program = body => `programa { funcao inicio() { ${body} } }`;
const cases = [
  ['símbolo não declarado', program('escreva(x)'), 'ErroSimboloNaoDeclarado'],
  ['símbolo redeclarado', program('inteiro x = 1 inteiro x = 2'), 'ErroSimboloRedeclarado'],
  ['parâmetro redeclarado', 'programa { funcao inicio() {} funcao f(inteiro x, inteiro x) {} }', 'ErroParametroRedeclarado'],
  ['parâmetro e variável no mesmo escopo', 'programa { funcao inicio() {} funcao f(inteiro x) { inteiro x = 2 } }', 'ErroSimboloRedeclarado'],
  ['função reservada', 'programa { funcao inicio() {} funcao leia() {} }', 'ErroSimboloRedeclarado'],
  ['inicio ausente', 'programa { funcao outra() {} }', 'ErroFuncaoInicioInexistente'],
  ['inicio inválida', 'programa { funcao inicio(inteiro x) {} }', 'ErroFuncaoInicioNaoAceitaParametros'],
  ['retorno ausente', 'programa { funcao inicio() {} funcao inteiro f(inteiro x) { se(x > 0) retorne 1 } }', 'ErroFuncaoSemRetorne'],
  ['retorno incompatível', 'programa { funcao inicio() {} funcao inteiro f() { retorne "texto" } }', 'ErroTiposIncompativeis'],
  ['retorno vazio de função tipada', 'programa { funcao inicio() {} funcao inteiro f() { retorne } }', 'ErroTiposIncompativeis'],
  ['retorno em função vazia', program('retorne 1'), 'ErroTiposIncompativeis'],
  ['retorno de vetor', 'programa { funcao inicio() {} funcao inteiro[] f() { inteiro v[2] retorne v } }', 'ErroRetornoVetorMatriz'],
  ['variável não inicializada', program('inteiro x escreva(x)'), 'ErroSimboloNaoInicializado'],
  ['variável talvez não inicializada', program('inteiro x se(verdadeiro) x = 1 escreva(x)'), 'ErroVariavelPodeNaoTerSidoInicializada'],
  ['constante sem valor', program('const inteiro x'), 'ErroSimboloNaoInicializado'],
  ['constante com expressão', program('const inteiro x = 1 + 2'), 'ErroInicializacaoConstante'],
  ['alteração de constante', program('const inteiro x = 1 x = 2'), 'ErroAtribuirEmConstante'],
  ['alteração de constante de biblioteca', 'programa { inclua biblioteca Matematica --> m funcao inicio() { m.PI = 1.0 } }', 'ErroAtribuirConstanteBiblioteca'],
  ['atribuição em expressão', program('1 = 2'), 'ErroAtribuirEmExpressao'],
  ['atribuição em chamada', 'programa { funcao inteiro f() { retorne 1 } funcao inicio() { f() = 2 } }', 'ErroAtribuirEmChamadaFuncao'],
  ['atribuição em biblioteca', 'programa { inclua biblioteca Matematica --> m funcao inicio() { m = 1 } }', 'ErroAtribuirFuncaoBiblioteca'],
  ['atribuição incompatível', program('inteiro x = "texto"'), 'ErroTiposIncompativeis'],
  ['condição se não lógica', program('se(1) escreva(1)'), 'ErroTiposIncompativeis'],
  ['condição enquanto não lógica', program('enquanto("texto") escreva(1)'), 'ErroTiposIncompativeis'],
  ['negação não lógica', program('escreva(nao 1)'), 'ErroTiposIncompativeis'],
  ['menos unário em texto', program('escreva(-"texto")'), 'ErroTiposIncompativeis'],
  ['módulo real', program('escreva(1.5 % 2)'), 'ErroTiposIncompativeis'],
  ['bitwise real', program('escreva(1.5 & 2)'), 'ErroTiposIncompativeis'],
  ['igualdade entre tipos diferentes', program('escreva(1 == "1")'), 'ErroTiposIncompativeis'],
  ['expressão solta', program('inteiro x = 1 x == 2'), 'ErroBlocoInvalido'],
  ['código após retorne', program('retorne; escreva(1)'), 'ErroCodigoNaoAlcancavel'],
  ['código após laço infinito', program('enquanto(verdadeiro) {} escreva(1)'), 'ErroCodigoNaoAlcancavel'],
  ['para sem condição', program('para(;;) {}'), 'ErroParaSemExpressaoComparacao'],
  ['para vazio', program('para() {}'), 'ErroParaEsperaCondicao'],
  ['para inicialização incorreta', program('para(2; verdadeiro; ) { pare }'), 'ErroInicializacaoErrada'],
  ['para incremento incorreto', program('para(inteiro i=0; i<3; 2) {}'), 'ErroParaSemExpressaoAtribuicao'],
  ['escolha com real', program('escolha(2.5) { caso 2: pare }'), 'ErroTiposIncompativeis'],
  ['caso com tipo diferente', program("escolha(2) { caso 'a': pare }"), 'ErroTiposIncompativeis'],
  ['pare fora de laço', program('pare'), 'ErroPareForaDeLoopOuSwitch'],
  ['continue não suportado', program('continue'), 'ErroComandoNaoSuportado'],
  ['leia com literal', program('leia(1)'), 'ErroLeiaNecessitaReferencia'],
  ['leia com constante', program('const inteiro x=1 leia(x)'), 'ErroLeiaNecessitaReferencia'],
  ['leia sem argumentos', program('leia()'), 'ErroNumeroParametrosFuncao'],
  ['limpa com argumentos', program('limpa(1)'), 'ErroNumeroParametrosFuncao'],
  ['argumento excedente', 'programa { funcao inicio() { f(1) } funcao f() {} }', 'ErroParametroExcedente'],
  ['argumento incompatível', 'programa { funcao inicio() { f("a") } funcao f(inteiro x) {} }', 'ErroTipoParametroIncompativel'],
  ['referência literal', 'programa { funcao inicio() { f(1) } funcao f(inteiro &x) { x = 2 } }', 'ErroPassagemParametroInvalida'],
  ['referência de tipo diferente', 'programa { funcao inicio() { real x=1.0 f(x) } funcao f(inteiro &x) {} }', 'ErroTipoParametroIncompativel'],
  ['quantificador incompatível', 'programa { funcao inicio() { inteiro x=1 f(x) } funcao f(inteiro x[]) {} }', 'ErroQuantificadorParametroFuncao'],
  ['biblioteca não incluída', program('escreva(Matematica.PI)'), 'ErroBibliotecaNaoInserida'],
  ['alias inexistente', program('escreva(m.PI)'), 'ErroAliasInexistente'],
  ['biblioteca inexistente', 'programa { inclua biblioteca Inexistente funcao inicio() {} }', 'ErroInclusaoBiblioteca'],
  ['biblioteca duplicada', 'programa { inclua biblioteca Matematica inclua biblioteca Matematica funcao inicio() {} }', 'ErroInclusaoBiblioteca'],
  ['alias duplicado', 'programa { inclua biblioteca Matematica --> m inclua biblioteca Texto --> m funcao inicio() {} }', 'ErroInclusaoBiblioteca'],
  ['constante inexistente', 'programa { inclua biblioteca Matematica --> m funcao inicio() { escreva(m.X) } }', 'ErroConstanteNaoEncontradaNaBiblioteca'],
  ['método inexistente', 'programa { inclua biblioteca Matematica --> m funcao inicio() { m.foo() } }', 'ErroSimboloNaoDeclarado'],
  ['escalar utilizado como vetor', program('inteiro x=1 escreva(x[0])'), 'ErroReferenciaInvalida'],
  ['índice real', program('inteiro v[2] escreva(v[1.5])'), 'ErroTiposIncompativeis'],
  ['atribuição em vetor inteiro', program('inteiro v[2] v = 1'), 'ErroAoAtribuirEmVetor'],
  ['atribuição em matriz inteira', program('inteiro v[2][2] v = 1'), 'ErroAoAtribuirEmMatriz'],
  ['vetor em variável escalar', program('inteiro v[2] inteiro x=v'), 'ErroAtribuirMatrizVetorEmVariavel'],
  ['vetor inicializado com escalar', program('inteiro v[2] = 1'), 'ErroAoInicializarVetor'],
  ['matriz inicializada com escalar', program('inteiro v[2][2] = 1'), 'ErroAoInicializarMatriz'],
  ['tipos misturados no vetor', program('inteiro v[] = {1, 2.5}'), 'ErroDefinirTipoDadoVetorLiteral'],
  ['tipos misturados na matriz', program('inteiro v[][] = {{1, 2}, {3, 4.5}}'), 'ErroDefinirTipoDadoMatrizLiteral'],
  ['vetor vazio', program('inteiro v[] = {}'), 'ErroVetorSemElementos'],
  ['vetor sem tamanho', program('inteiro v[]'), 'ErroExpressaoTamanhoVetorMatriz'],
  ['tamanho real', program('inteiro v[2.5]'), 'ErroExpressaoTamanhoVetorMatriz'],
  ['tamanho não constante', program('inteiro n=3 inteiro v[n]'), 'ErroExpressaoTamanhoVetorMatriz'],
  ['tamanho zero', program('inteiro v[0]'), 'ErroTamanhoVetorMatriz'],
  ['tamanho máximo vetor', program('inteiro v[16777217]'), 'ErroTamanhoMaximoVetor'],
  ['tamanho máximo matriz', program('inteiro v[100000][100000]'), 'ErroTamanhoMaximoMatriz'],
  ['quantidade de elementos', program('inteiro v[2]={1}'), 'ErroQuantidadeElementosInicializacaoVetor'],
  ['quantidade de linhas', program('inteiro v[2][2]={{1,2}}'), 'ErroQuantidadeLinhasIncializacaoMatriz'],
  ['quantidade de colunas', program('inteiro v[2][2]={{1},{2}}'), 'ErroQuantidadeElementosColunaInicializacaoMatriz'],
  ['cadeia incompleta', program('escreva("abc)'), 'ErroCadeiaIncompleta'],
  ['linha em cadeia', program('escreva("a\nb")'), 'ErroLinhaPuladaEmString'],
  ['escape inválido', program('escreva("\\q")'), 'ErroEscapeUnico'],
  ['caractere desconhecido', program('@'), 'ErroCaracterInvalidoReferencia'],
  ['inteiro fora de intervalo', program('escreva(2147483648)'), 'ErroInteiroForaDoIntervalo'],
  ['tipo ausente no parâmetro', 'programa { funcao inicio() {} funcao f(x) {} }', 'ErroParametrosNaoTipados'],
  ['nome ausente', program('inteiro = 1'), 'ErroNomeSimboloEstaFaltando'],
  ['nome inválido', program('inteiro 123 = 1'), 'ErroNomeIncompativel'],
  ['colchetes antes do nome', program('inteiro[] v = {1}'), 'ErroChaveDeVetorMatrizMalPosicionada'],
  ['real com vírgula', program('real x = 2,75'), 'ErroRealComVirgula'],
  ['senao inesperado', program('senao escreva(1)'), 'ErroSenaoInesperado'],
  ['dois pontos ausente', program('escolha(1) { caso 1 pare }'), 'ErroFaltaDoisPontos'],
  ['parêntese ausente', program('escreva(1'), 'ErroParentesis'],
  ['expressão incompleta', program('inteiro x = 1 /;'), 'ErroExpressaoIncompleta'],
  ['comando ausente', program('se(verdadeiro)'), 'ErroComandoEsperado'],
  ['expressão fora de função', 'programa { escreva(1) funcao inicio() {} }', 'ErroExpressaoForaEscopoFuncao'],
  ['expressão fora de programa', 'programa { funcao inicio() {} } escreva(1)', 'ErroExpressoesForaEscopoPrograma'],
];

for (const [name, source, code] of cases) test(`Java: ${name}`, () => {
  const messages = analyzeCode(source).diagnostics;
  assert.ok(messages.some(item => item.code?.endsWith('.' + code)), JSON.stringify(messages, null, 2));
  assert.ok(messages.every(item => Number.isInteger(item.from) && item.from >= 0 && item.to <= source.length));
  assert.throws(() => transpilePortugol(source), error => error.diagnostics?.some(item => item.code?.endsWith('.' + code)));
});

test('os cinco avisos do Java estão presentes e não impedem compilar', () => {
  const source = 'programa { inteiro x=1 funcao inicio() { inteiro x=3.45 inteiro v[1] inteiro m[1][1] inteiro n[1][3] escreva(x,v[0],m[0][0],n[0][0]) } }';
  const messages = analyzeCode(source).diagnostics;
  for (const code of ['AvisoValorExpressaoSeraConvertido', 'AvisoSimboloGlobalOcultado', 'AvisoVetorPodeSerVariavel', 'AvisoMatrizPodeSerVariavel', 'AvisoMatrizPodeSerVetor']) assert.ok(messages.some(d => d.code === 'Aviso.' + code && d.severity === 'warning'), code);
  assert.doesNotThrow(() => transpilePortugol(source));
});

test('recuperação coleta vários erros sintáticos e semânticos', () => {
  const source = program('inteiro x = ;\n cadeia s = 2\n escreva(desconhecido)');
  const messages = analyzeCode(source).diagnostics;
  for (const code of ['ErroExpressaoIncompleta', 'ErroTiposIncompativeis', 'ErroSimboloNaoDeclarado']) assert.ok(messages.some(d => d.code.endsWith(code)), code);
});

test('caminhos inicializados, escopos e assinaturas válidas do Java', () => {
  const source = 'programa { funcao inicio(cadeia args[]) { inteiro x se(verdadeiro) x=1 senao x=2 escreva(x) } funcao inteiro f(logico b) { se(b) retorne 1 senao retorne 2 } }';
  assert.doesNotThrow(() => transpilePortugol(source));
});

async function execute(source, options = {}) {
  const runtime = new PortugolRuntime(null, null, options), output = [];
  runtime.escreva = async (...values) => output.push(...values);
  try { await new Function('__runtime', transpilePortugol(source))(runtime); return output; }
  finally { runtime.destroy(); }
}

test('índices com incremento são avaliados uma única vez em atribuição e referência', async () => {
  const source = 'programa { funcao f(inteiro &x) { x += 1 } funcao inicio() { inteiro v[3]={1,2,3} inteiro i=0 v[i++] += 4 f(v[i++]) v[i++]++ escreva(i,v[0],v[1],v[2]) } }';
  assert.deepEqual(await execute(source), [3, 5, 3, 4]);
});

test('textos, booleanos e limites inteiros preservam as regras do Java', async () => {
  assert.deepEqual(await execute(program('escreva("a" < "b", verdadeiro + falso, -2147483648, 0xffffffff)')), [true, true, -2147483648, -1]);
});

test('divisão, limites de vetor/matriz, recursão e memória têm códigos e posição', async () => {
  const errors = [
    [program('inteiro x = 1 / 0'), 'ErroDivisaoPorZero', {}],
    [program('inteiro v[2] escreva(v[-1])'), 'ErroIndiceVetorInvalido', {}],
    [program('inteiro v[2][2] escreva(v[0][3])'), 'ErroIndiceMatrizInvalido', {}],
    [program('inteiro v[20]'), 'ErroMemoriaInsuficiente', { maxArrayElements: 10 }],
    ['programa { funcao f() { f() } funcao inicio() { f() } }', 'ErroEstouroPilha', { maxCallDepth: 3 }],
  ];
  for (const [source, code, options] of errors) await assert.rejects(execute(source, options), error => error.code === 'ErroExecucao.' + code && error.from > 0 && error.to > error.from);
});

test('entrada inválida e conversão impossível têm mensagens para o aluno', () => {
  const runtime = new PortugolRuntime(null, null);
  try {
    for (const [input, type] of [['abc','inteiro'], ['2147483648','inteiro'], ['NaN','real'], ['sim','logico'], ['ab','caracter']]) assert.throws(() => runtime._parseInput(input, type), e => e.code === 'ErroExecucao.ErroValorEntradaInvalido');
    assert.throws(() => runtime.cast('texto', 'inteiro'), e => e.code === 'ErroExecucao.ErroImpossivelConverterTipos');
    assert.throws(() => runtime.element([undefined], 0, false, 5, 8).value, e => e.code === 'ErroExecucao.ErroValorVetorMatrizNaoInicializado');
  } finally { runtime.destroy(); }
});

test('bibliotecas preservam sua mensagem e a localização da chamada', async () => {
  const source = 'programa { inclua biblioteca Tipos --> t funcao inicio() { escreva(t.cadeia_para_inteiro("abc", 10)) } }';
  await assert.rejects(execute(source), e => e.code === 'ErroExecucao.ErroExecucaoBiblioteca' && source.slice(e.from, e.to).startsWith('t.cadeia_para_inteiro'));
});

test('bibliotecas rejeitam cores, caracteres, subtextos e bases inválidos', async () => {
  const runtime = new PortugolRuntime(null, null);
  try {
    for (const [library, method, args] of [
      ['Graficos', 'criar_cor', [300, 0, 0]],
      ['Texto', 'obter_caracter', ['abc', -1]],
      ['Texto', 'obter_caracter', ['abc', 3]],
      ['Texto', 'extrair_subtexto', ['abc', 2, 1]],
      ['Tipos', 'cadeia_para_caracter', ['abc']],
      ['Tipos', 'caracter_para_logico', ['x']],
      ['Tipos', 'inteiro_para_cadeia', [1, 8]],
      ['Util', 'sorteia', [2, 1]],
      ['Util', 'sorteia', [1, 1]],
    ]) await assert.rejects(runtime.callLibrary(library, method, args, 5, 10), e => e.code === 'ErroExecucao.ErroExecucaoBiblioteca' && e.from === 5 && e.to === 10);
  } finally { runtime.destroy(); }
});

test('Objetos valida JSON, propriedades, tipos, índices e endereços; preserva tipos Portugol', async () => {
  const runtime = new PortugolRuntime(null, null), o = runtime.Objetos;
  try {
    const address = o.criar_objeto_via_json('{"n":2,"valores":[1,2],"filho":{"nome":"teste"}}');
    assert.equal(o.obter_propriedade_tipo_inteiro(address, 'n'), 2);
    assert.equal(o.obter_propriedade_tipo_inteiro_em_vetor(address, 'valores', 1), 2);
    assert.equal(o.obter_propriedade_tipo_cadeia(o.obter_propriedade_tipo_objeto(address, 'filho'), 'nome'), 'teste');
    for (const action of [() => o.criar_objeto_via_json('{'), () => o.obter_propriedade_tipo_inteiro(address, 'inexistente'), () => o.obter_propriedade_tipo_cadeia(address, 'n'), () => o.obter_propriedade_tipo_inteiro_em_vetor(address, 'valores', 2), () => o.obter_tamanho_vetor_propriedade(address, 'n')]) assert.throws(action, e => e.code === 'ErroExecucao.ErroExecucaoBiblioteca');
    o.liberar_objeto(address);
    assert.throws(() => o.obter_json(address), /objeto válido/);
  } finally { runtime.destroy(); }
  const source = 'programa { inclua biblioteca Objetos --> o funcao inicio() { inteiro id=o.criar_objeto() o.atribuir_propriedade(id,"real",1.0) o.atribuir_propriedade(id,"car",\'a\') escreva(o.tipo_propriedade(id,"real"),o.tipo_propriedade(id,"car"),o.obter_propriedade_tipo_caracter(id,"car")) } }';
  assert.deepEqual(await execute(source), [4, 3, 'a']);
});

test('ServicosWeb exige conexão, traduz falhas e mantém método/cabeçalhos/corpo', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => { calls.push({ url, ...options }); return new Response('{"ok":true}'); });
  const runtime = new PortugolRuntime(null, null), s = runtime.ServicosWeb;
  try {
    assert.throws(() => s.adicionar_cabecalho('x', 'y'), /conexão customizada/);
    s.abrir_conexao('https://exemplo.test/servico');
    s.adicionar_cabecalho('Content-Type', 'application/json');
    s.adicionar_parametros('{"n":1}');
    assert.equal(await s.fazer_requisicao(s.PUBLICAR), '{"ok":true}');
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].body, '{"n":1}');
    assert.equal(calls[0].headers['content-type'], 'application/json');
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.rejects(runtime.callLibrary('ServicosWeb', 'obter_dados', ['https://exemplo.test/falha'], 7, 12), e => e.code === 'ErroExecucao.ErroExecucaoBiblioteca' && /CORS/.test(e.message) && e.from === 7);
  } finally { runtime.destroy(); }
});

test('parar execução cancela requisições pendentes de ServicosWeb', async t => {
  t.mock.method(globalThis, 'fetch', (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('cancelado')))));
  const runtime = new PortugolRuntime(null, null);
  try {
    const request = runtime.ServicosWeb.obter_dados('https://exemplo.test/pendente');
    runtime.abort();
    await assert.rejects(request, /EXECUCAO_INTERROMPIDA/);
  } finally { runtime.destroy(); }
});

test('extensões de parâmetros opcionais do web continuam disponíveis', () => {
  assert.doesNotThrow(() => transpilePortugol('programa { inclua biblioteca Graficos --> g funcao inicio() { g.iniciar_modo_grafico() escreva(g.criar_cor(1,2,3,255)) } }'));
});

test('os 120 exemplos continuam passando pela análise', async () => {
  const catalog = JSON.parse(await readFile('public/exemplos/index.json', 'utf8'));
  for (const entry of catalog) {
    const source = await readFile('public/exemplos/' + entry.caminho, 'utf8');
    const errors = analyzeCode(source).diagnostics.filter(d => d.severity === 'error');
    assert.equal(errors.length, 0, `${entry.caminho}: ${JSON.stringify(errors)}`);
  }
});


test('Tipos preserva a representação binária de 32 bits usada pelos exemplos Java', () => {
  const runtime = new PortugolRuntime(null, null);
  try {
    assert.equal(runtime.Tipos.inteiro_para_cadeia(1, 2), '00000000000000000000000000000001');
    assert.equal(runtime.Tipos.inteiro_para_cadeia(-1, 16), 'FFFFFFFF');
    assert.equal(runtime.Tipos.inteiro_para_cadeia(255, 16), '000000FF');
  } finally { runtime.destroy(); }
});


test('divisão após chamada de função aponta para a expressão do chamador', async () => {
  const source = 'programa { funcao inteiro zero() { retorne 0 } funcao inicio() { inteiro n = zero() / 0 } }';
  await assert.rejects(execute(source), error => error.code === 'ErroExecucao.ErroDivisaoPorZero' && source.slice(error.from, error.to) === 'zero() / 0');
});
