import { readFile, writeFile } from 'node:fs/promises';
import { PortugolRuntime } from '../js/runtime.js';
const sourceRoot = process.argv[2] || '../Portugol-Studio/core/src/main/java/br/univali/portugol/nucleo/bibliotecas';
const libraries = ['Objetos', 'ServicosWeb', 'Graficos', 'Matematica', 'Util', 'Teclado', 'Mouse', 'Tipos', 'Calendario', 'Texto', 'Arquivos', 'Sons', 'Internet'];
const types = { int: 'inteiro', double: 'real', boolean: 'logico', String: 'cadeia', char: 'caracter', void: 'vazio', Object: 'todos' };
const contracts = {}, constants = {}, runtime = new PortugolRuntime(null, null);
function field(source, name) {
  const value = source.match(new RegExp('\\b' + name + '\\s*=\\s*("(?:[^"\\\\]|\\\\.)*"(?:\\s*\\+\\s*"(?:[^"\\\\]|\\\\.)*")*)'))?.[1];
  return value ? [...value.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(match => match[1].replace(/\\n/g, '\n').replace(/\\t/g, ' ').replace(/\\"/g, '"').replace(/\\\\/g, '\\')).join('').replace(/<[^>]+>/g, '').trim() : '';
}
function annotations(source, name) {
  const results = [];
  for (const match of source.matchAll(new RegExp('@' + name + '\\s*\\(', 'g'))) {
    let depth = 1, quoted = false, escaped = false, end = match.index + match[0].length;
    const start = end;
    for (; end < source.length && depth; end++) {
      const char = source[end];
      if (quoted) { if (char === '"' && !escaped) quoted = false; escaped = char === '\\' && !escaped; }
      else if (char === '"') { quoted = true; escaped = false; }
      else if (char === '(') depth++;
      else if (char === ')') depth--;
    }
    results.push(source.slice(start, end - 1));
  }
  return results;
}
for (const library of libraries) {
  const bytes = await readFile(sourceRoot + '/' + library + '.java');
  let source; try { source = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { source = new TextDecoder('windows-1252').decode(bytes); }
  contracts[library] = {};
  constants[library] = {};
  for (const match of source.matchAll(/public\s+(?:static\s+)?final\s+(int|double|boolean|String|char|Object)\s+([A-Z][A-Z_0-9]*)\s*=/g)) {
    const documentation = source.slice(source.lastIndexOf('public ', match.index - 1) + 1, match.index);
    if (match[2] in runtime[library]) constants[library][match[2]] = { type: types[match[1]], description: field(annotations(documentation, 'DocumentacaoConstante').at(-1) || '', 'descricao') };
  }
  for (const match of source.matchAll(/public\s+(?:static\s+)?(?:final\s+)?(void|int|double|boolean|String|char|Object)\s+([a-z][a-z_0-9]*)\s*\(([^)]*)\)/g)) {
    const documentation = source.slice(source.lastIndexOf('public ', match.index - 1) + 1, match.index);
    if (contracts[library][match[2]]) {
      contracts[library][match[2]].available ||= typeof runtime[library]?.[match[2]] === 'function' && documentation.includes('@DocumentacaoFuncao');
      continue;
    }
    contracts[library][match[2]] = {
      type: types[match[1]],
      description: field(documentation, 'descricao'),
      returns: field(documentation, 'retorno'),
      available: typeof runtime[library]?.[match[2]] === 'function' && documentation.includes('@DocumentacaoFuncao'),
      parameters: match[3].split(',').filter(p => p.trim()).map((p, index) => ({
        type: types[p.match(/\b(int|double|boolean|String|char|Object)\b/)?.[1]] || 'vazio',
        dimensions: (p.match(/\[\]/g) || []).length,
        name: p.match(/\b(?:int|double|boolean|String|char|Object)(?:\[\])*\s+(\w+)/)?.[1] || 'parametro' + (index + 1),
      })),
    };
    const documentedParameters = annotations(documentation, 'DocumentacaoParametro');
    for (const [index, parameter] of contracts[library][match[2]].parameters.entries()) {
      const annotation = documentedParameters.find(item => field(item, 'nome') === parameter.name) || (documentedParameters.length === contracts[library][match[2]].parameters.length ? documentedParameters[index] : null);
      parameter.description = annotation ? field(annotation, 'descricao') : '';
      if (annotation) parameter.name = field(annotation, 'nome') || parameter.name;
    }
  }
}
runtime.destroy();
await writeFile('runtime/core/library-contracts.js', "// Contratos gerados a partir das bibliotecas Java do projeto.\nimport { webGraphicsContracts, webMouseContracts } from './web-library-contracts.js';\nconst contracts = " + JSON.stringify(contracts, null, 2) + ';\nObject.assign(contracts.Graficos, webGraphicsContracts);\nObject.assign(contracts.Mouse, webMouseContracts);\nexport default contracts;\nexport const libraryConstants = ' + JSON.stringify(constants, null, 2) + ';\n');

