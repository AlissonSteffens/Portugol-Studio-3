import { assetUrl } from './assets.js';
import { tokenize } from '../../js/transpiler.js';
import { parseProgram } from '../../js/compiler.js';
import { normalizePath, repository } from './repository.js';

function decodeLiteral(value) {
  return value.slice(1, -1).replace(/\\(u[\da-fA-F]{4}|[\\"'nrt])/g, (_, escape) => escape.startsWith('u') ? String.fromCharCode(parseInt(escape.slice(1), 16)) : ({ n: '\n', r: '\r', t: '\t' }[escape] || escape));
}
function traverse(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (node.kind) visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(item => traverse(item, visit));
    else if (value && typeof value === 'object') traverse(value, visit);
  }
}
export function resourcePatterns(code, requiredOnly = false) {
  const tokens = tokenize(code), patterns = new Set();
  try {
    const program = parseProgram(tokens), values = new Map(), dynamic = new Set(), functions = new Map(program.functions.map(fn => [fn.name, fn]));
    traverse(program, node => {
      if (['unary', 'postfix'].includes(node.kind) && ['++', '--'].includes(node.op) && node.value.kind === 'name') dynamic.add(node.value.name);
      if (node.kind === 'binary' && ['+=', '-=', '*=', '/=', '%='].includes(node.op) && node.left.kind === 'name') dynamic.add(node.left.name);
    });
    const evaluate = node => {
      if (!node) return ['*'];
      if (node.kind === 'literal') return [['string', 'char'].includes(node.token.type) ? decodeLiteral(node.token.value) : node.token.value];
      if (node.kind === 'name') return dynamic.has(node.name) ? ['*'] : [...(values.get(node.name) || ['*'])];
      if (node.kind === 'binary' && node.op === '+') return evaluate(node.left).flatMap(left => evaluate(node.right).map(right => left + right)).slice(0, 60);
      if (node.kind === 'call' && node.target.kind === 'member' && node.target.name === 'obter_diretorio_usuario') return ['usuario'];
      return ['*'];
    };
    const add = (name, candidates) => {
      const known = values.get(name) || new Set();
      for (const value of candidates) if (value !== '*' && known.size < 60) known.add(value);
      if (known.size) values.set(name, known);
    };
    // Propaga prefixos e parâmetros conhecidos sem executar o programa do aluno.
    for (let pass = 0; pass < 4; pass++) traverse(program, node => {
      if (node.kind === 'declaration') for (const item of node.items) if (item.value) add(item.name, evaluate(item.value));
      if (node.kind === 'binary' && node.op === '=' && node.left.kind === 'name') add(node.left.name, evaluate(node.right));
      if (node.kind === 'call' && node.target.kind === 'name') {
        const fn = functions.get(node.target.name);
        fn?.parameters.forEach((parameter, i) => add(parameter.name, evaluate(node.args[i])));
      }
    });
    traverse(program, node => {
      if (node.kind !== 'call' || node.target.kind !== 'member') return;
      const indexes = { carregar_imagem: 0, carregar_som: 0, carregar_fonte: 0, abrir_arquivo: 0, arquivo_existe: 0, substituir_texto: 0, salvar_imagem: 1, baixar_imagem: 1 };
      const writesFile = node.target.name === 'abrir_arquivo' && (node.args[1]?.kind === 'member' && ['MODO_ESCRITA', 'MODO_ACRESCENTAR'].includes(node.args[1].name) || node.args[1]?.kind === 'literal' && ['1', '2'].includes(node.args[1].token.value));
      if (requiredOnly === 'outputs' && !writesFile && !['salvar_imagem', 'baixar_imagem'].includes(node.target.name)) return;
      if (requiredOnly === true && (writesFile || ['arquivo_existe', 'salvar_imagem', 'baixar_imagem'].includes(node.target.name))) return;
      const index = indexes[node.target.name];
      if (index !== undefined) for (const value of evaluate(node.args[index])) if (value && !/^\*+$/.test(value)) patterns.add(value);
    });
  } catch {
    // Durante a digitação, caminhos literais continuam visíveis mesmo com código incompleto.
    for (const token of tokens) if (token.type === 'string' && /\.(png|jpe?g|gif|webp|bmp|svg|mp3|wav|ttf|txt|db|lvl|pln|iso)["']$/i.test(token.value)) patterns.add(decodeLiteral(token.value));
  }
  return [...patterns].filter(path => !/^https?:/i.test(path));
}

export function collectResources(code, example, entries, localFiles) {
  const result = new Map(), available = new Set([...(example?.recursos || []), ...entries.map(entry => entry.path), ...Object.keys(localFiles)]);
  const base = example ? assetUrl('exemplos/' + example.caminho.slice(0, example.caminho.lastIndexOf('/') + 1)) : '';
  const addOriginal = path => {
    const originalURL = base + path.split('/').map(encodeURIComponent).join('/');
    result.set(path, { path, source: 'original', originalURL, read: async () => { const response = await fetch(originalURL); if (!response.ok) throw new Error('Não foi possível carregar ' + path); return response.blob(); } });
  };
  for (const pattern of resourcePatterns(code)) {
    let path; try { path = normalizePath(pattern); } catch { continue; }
    if (path.includes('*')) {
      const regex = new RegExp('^' + path.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
      for (const candidate of available) if (regex.test(candidate) && example?.recursos.includes(candidate)) addOriginal(candidate);
    } else if (example?.recursos.includes(path)) addOriginal(path);
    else result.set(path, { path, source: 'missing' });
  }
  for (const entry of entries) result.set(entry.path, { ...result.get(entry.path), ...entry, source: 'browser', read: () => repository.read(entry.path) });
  for (const [path, blob] of Object.entries(localFiles)) result.set(path, { ...result.get(path), path, size: blob.size, type: blob.type, blob, source: 'local', read: async () => blob });
  return [...result.values()].sort((a, b) => a.path.localeCompare(b.path, 'pt-BR'));
}
