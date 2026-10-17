import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '../Portugol-Studio/core/src/main/java/br/univali/portugol/nucleo');
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
function decode(bytes) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return new TextDecoder('windows-1252').decode(bytes); }
}
const sources = await Promise.all((await files(root)).filter(file => file.endsWith('.java')).map(async file => ({ file, source: decode(await readFile(file)) })));
const tableSource = sources.find(item => item.file.endsWith('TabelaCompatibilidadeTiposPortugol.java')).source;
const tables = {};
for (const match of tableSource.matchAll(/private Object\[\]\[\] criarTabelaCompatibilidade(\w+)\(\)\s*\{([\s\S]*?return tabela;)/g)) {
  tables[match[1]] = Object.fromEntries([...match[2].matchAll(/tabela\[(\w+)\.ordinal\(\)\]\[(\w+)\.ordinal\(\)\] = (\w+);/g)].map(row => [`${row[1].toLowerCase()}:${row[2].toLowerCase()}`, row[3].toLowerCase()]));
}
const operators = { '=': 'Atribuicao', '+': 'Soma', '-': 'DivisaoMultiplicacaoSubtracao', '*': 'DivisaoMultiplicacaoSubtracao', '/': 'DivisaoMultiplicacaoSubtracao', '%': 'Modulo', '==': 'DiferencaIgualdade', '!=': 'DiferencaIgualdade', e: 'EOu', ou: 'EOu', '<': 'MaiorMaiorIgualMenorMenorIgual', '>': 'MaiorMaiorIgualMenorMenorIgual', '<=': 'MaiorMaiorIgualMenorMenorIgual', '>=': 'MaiorMaiorIgualMenorMenorIgual', '&': 'Bitwise', '|': 'Bitwise', '^': 'Bitwise', '<<': 'Bitwise', '>>': 'Bitwise', '>>>': 'Bitwise' };
await writeFile('core/semantic/type-compatibility.js', '// Tabelas do core Java: TabelaCompatibilidadeTiposPortugol.java.\nexport const compatibility = ' + JSON.stringify(tables, null, 2) + ';\nexport const operatorTables = ' + JSON.stringify(operators, null, 2) + ';\n');

// Mensagens antigas que foram unificadas ou antecipadas pelo analisador web.
const equivalents = {
  ErroAlgoritmoContemErros: ['implementado', 'ide/src/App.jsx', 'Resumo de compilação com erros; detalhes individuais no painel.'],
  ErroOperandoEsquerdoAtribuicaoConstante: ['unificado', 'core/semantic/analyzer.js', 'ErroAtribuirEmConstante / ErroAtribuirEmExpressao distinguem constantes e literais.'],
  ErroSimboloFaltandoOuRealComVirgula: ['unificado', 'core/compiler.js', 'ErroNomeSimboloEstaFaltando / ErroRealComVirgula distinguem as duas causas.'],
  ErroFuncaoInicialNaoDeclarada: ['antecipado', 'core/semantic/analyzer.js', 'ErroFuncaoInicioInexistente antes de executar.'],
  ErroFuncaoInicialInvalida: ['antecipado', 'core/semantic/analyzer.js', 'Validação da assinatura inicial, incluindo inicio(cadeia argumentos[]), aceita pelo executor Java.'],
  ErroCodigoNaoAlcancavel: ['antecipado', 'core/semantic/analyzer.js', 'Código após retorne, pare ou laço infinito sem saída.'],
  ErroVariavelPodeNaoTerSidoInicializada: ['antecipado', 'core/semantic/analyzer.js', 'Análise de caminhos de condições e laços; leitura também protegida em execução.'],
  ErroVaParaSemTitulo: ['inativo no Java', 'core/semantic/analyzer.js', 'O visitante Java rejeita va_para e rótulos com ErroComandoNaoSuportado; o web mantém essa rejeição.'],
  ErroObservadorDepuracao: ['específico da JVM', 'ide/src/App.jsx', 'O inspetor web usa eventos; não existe o protocolo ObservadorDepuracao do executor antigo.'],
  ErroCompilacao: ['substituído', 'core/compiler.js', 'Compilação Java/javac substituída pelo parser, análise semântica e geração JavaScript.'],
  ErroAnaliseNaCompilacao: ['substituído', 'core/compiler.js', 'A compilação é bloqueada com a lista de diagnósticos quando a análise encontra erros.'],
  ErroCarregamentoBiblioteca: ['antecipado', 'core/semantic/analyzer.js', 'ErroInclusaoBiblioteca valida bibliotecas e aliases antes de executar. Não há carregamento de JARs.'],
  ErroExecucaoBiblioteca: ['implementado', 'core/execution/values.js', 'A mensagem da biblioteca é preservada, com código estável e posição da chamada.'],
  ErroAoRenomearSimbolo: ['fora da análise de código', 'docs/java-diagnostics.md', 'Exceção da API Java de refatoração/renomeação, recurso inexistente no web; não é erro no programa do aluno.'],
  ErroAoTentarObterDeclaracaoDoSimbolo: ['fora da análise de código', 'docs/java-diagnostics.md', 'Exceção da API Java de navegação de declarações; a árvore web navega pelas posições do próprio parser.'],
};
const entries = [];
const literals = text => [...text.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(match => match[1]);
for (const { file, source } of sources) {
  const name = path.basename(file, '.java');
  if (!/^(Erro|Aviso)/.test(name) || /^(Erro|Aviso)(Analise|Semantico|Sintatico|SemiSintatico|Execucao)?$/.test(name)) continue;
  if (!/class\s+\w+/.test(source)) continue;
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const category = relative.includes('avisos/') ? 'aviso' : relative.includes('sintatica/') ? 'sintatica' : relative.includes('semantica/') || name === 'ErroAlgoritmoContemErros' ? 'semantica' : relative.includes('execucao/') || name === 'ErroExecucaoBiblioteca' ? 'execucao' : 'infraestrutura';
  const defaultHandler = category === 'sintatica' ? 'core/diagnostics/index.js / core/compiler.js' : category === 'execucao' ? 'core/execution/values.js / runtime/runtime.js' : 'core/semantic/analyzer.js';
  const equivalent = equivalents[name];
  const messageStart = source.search(/protected String construirMensagem/);
  entries.push({ class: name, source: relative, category, status: equivalent?.[0] || 'implementado', implementation: equivalent?.[1] || defaultHandler, notes: equivalent?.[2] || 'Diagnóstico com mensagem em português e posição no código.', originalFragments: literals(messageStart >= 0 ? source.slice(messageStart) : source) });
}
entries.sort((a, b) => a.category.localeCompare(b.category) || a.source.localeCompare(b.source));
const libraryMessages = [];
for (const { file, source } of sources.filter(item => item.file.includes(path.sep + 'bibliotecas' + path.sep))) {
  for (const match of source.matchAll(/throw new ErroExecucaoBiblioteca\(([\s\S]*?)\);/g)) libraryMessages.push({ source: path.relative(root, file).replaceAll('\\', '/'), line: source.slice(0, match.index).split('\n').length, originalFragments: literals(match[1]), implementation: 'core/execution/values.js: callLibrary', notes: 'Mensagem da implementação web da biblioteca com localização e código ErroExecucao.ErroExecucaoBiblioteca; dependências Swing/Java/native substituídas pelo navegador.' });
}
await mkdir('docs', { recursive: true });
await writeFile('docs/java-diagnostics-inventory.json', JSON.stringify(entries, null, 2) + '\n');
await writeFile('docs/java-library-messages-inventory.json', JSON.stringify(libraryMessages, null, 2) + '\n');
const counts = entries.reduce((all, item) => ({ ...all, [item.category]: (all[item.category] || 0) + 1 }), {});
const intro = `# Diagnósticos do core Java e implementação web\n\nInventário gerado de \\Portugol-Studio\\core\\src\\main\\java\\br\\univali\\portugol\\nucleo. Foram encontradas **${entries.length} classes concretas de erro/aviso** (${Object.entries(counts).map(([category, count]) => `${count} ${category}`).join(', ')}) e **${libraryMessages.length} lançamentos de mensagens das bibliotecas**. Tipos-base, tradutores e exceções internas de controle não são mensagens adicionais. As classes duplicadas do antigo interpretador e do executor compilado são listadas separadamente.\n\nO JSON ao lado contém os fragmentos originais de cada mensagem e seu arquivo de origem. Os textos web preservam o significado, com instruções em português e sem HTML ou stack trace no editor.\n\n## Regras incorporadas\n\n- Sintaxe e léxico: nomes, palavras reservadas, comentários/literais, escapes, intervalo de inteiros, parênteses, blocos, comandos e expressões incompletas.\n- Tipos: as dez tabelas de compatibilidade são extraídas literalmente do Java; operações, atribuições, argumentos e retornos as consultam.\n- Símbolos: escopo, redeclaração, constantes, referências, inicialização e ocultação de globais.\n- Funções: existência de inicio, assinatura inicial, quantidade/tipo/dimensão/modo dos argumentos, retorno em todos os caminhos e código inalcançável.\n- Vetores/matrizes: tamanho constante positivo, limite de posições, tipos homogêneos, forma e quantidade de elementos, índices e atribuição por posição.\n- Bibliotecas: inclusão, alias, funções e constantes existentes, parâmetros, falhas de execução com localização.\n- Execução: divisão por zero, leitura de variável/elemento sem valor, índices fora dos limites, pilha, memória, conversão e entrada inválida.\n- Os cinco avisos Java: conversão de valor, símbolo global ocultado, vetor que pode ser variável, matriz que pode ser variável, matriz que pode ser vetor. O aviso de símbolo sem uso é uma extensão web.\n\n## Diferenças explícitas de plataforma\n\nO executor Java aceita \`inicio(cadeia argumentos[])\`; no web os argumentos são um vetor vazio por padrão, configurável pelo runtime. A classe antiga que rejeitava qualquer parâmetro não determina a assinatura efetivamente aceita pelo executor. As extensões web de parâmetros opcionais existentes são preservadas em library-signatures.js.\n\nO limite semântico Java de 16777216 posições é preservado; o runtime web tem também seu limite configurável de memória (padrão: 2000000 elementos). Erros de JARs, JVM, observador do depurador e API de refatoração não são simulados como erros artificiais no código do aluno. As classes correspondentes estão discriminadas na tabela. Globais e elementos de arrays recebem os padrões do executor compilado Java; variáveis locais sem valor não são silenciosamente inicializadas com zero.\n\nA análise de inicialização é conservadora: não presume que condições separadas estejam correlacionadas. O exemplo varios.por foi ajustado para inicializar idade/altura antes das condições, sem modificar as saídas dos caminhos válidos.\n\n## Mapeamento completo\n\n| Classe Java / arquivo | Situação no web | Implementação / equivalência |\n| --- | --- | --- |\n`;
const rows = entries.map(item => `| ${item.class} — ${item.source} | ${item.status} | ${item.implementation}; ${item.notes} |`).join('\n');
await writeFile('docs/java-diagnostics.md', intro + rows + '\n\n## Reprodução\n\nExecute `npm run sync:diagnostics -- <diretório nucleo do core Java>` para regenerar o inventário e as tabelas. `npm test` inclui casos válidos e inválidos de todas as famílias, os cinco avisos, erros de execução e análise dos 120 exemplos.\n');
console.log(`${entries.length} classes e ${libraryMessages.length} mensagens de bibliotecas mapeadas; ${Object.keys(tables).length} tabelas de tipos sincronizadas.`);
