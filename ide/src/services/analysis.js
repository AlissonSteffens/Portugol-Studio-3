import { tokenize } from '../../../core/lexical/tokenizer.js';
import { analyzeTokens } from '../../../core/compiler.js';

export function analyzeCode(code) {
  const symbols = [];
  const tokens = tokenize(code);
  const { program, diagnostics } = analyzeTokens(tokens);
  const variable = (item, scope) => ({ ...item, kind: 'variable', scope, id: `${scope}:${item.from}`, children: [] });
  function collect(node, scope, children) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'declaration') { children.push(...node.items.map(item => variable(item, scope))); return; }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(item => collect(item, scope, children));
      else if (value && typeof value === 'object') collect(value, scope, children);
    }
  }
  if (program) {
    program.globals.forEach(node => collect(node, 'programa', symbols));
    for (const fn of program.functions) {
      const children = fn.parameters.map(item => ({ ...variable(item, fn.name), parameter: true }));
      collect(fn.body, fn.name, children);
      symbols.push({ ...fn, kind: 'function', id: `function:${fn.from}`, children });
    }
    const counts = new Map();
    tokens.filter(token => token.type === 'ident').forEach(token => counts.set(token.value, (counts.get(token.value) || 0) + 1));
    const all = symbols.flatMap(symbol => symbol.kind === 'function' ? [symbol, ...symbol.children] : [symbol]);
    for (const symbol of all) {
      if (symbol.name !== 'inicio' && counts.get(symbol.name) === 1) diagnostics.push({ code: 'Aviso.AvisoSimboloNaoUtilizado', from: symbol.from, to: symbol.to, severity: 'warning', message: `${symbol.kind === 'function' ? 'A função' : symbol.parameter ? 'O parâmetro' : 'A variável'} “${symbol.name}” não é ${symbol.kind === 'function' || !symbol.parameter ? 'utilizada' : 'utilizado'} no código.` });
    }

  }
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.kind === 'declaration') {
      const type = /\binteiro\b/.exec(code.slice(node.from, node.to));
      if (type) for (const item of node.items) if (item.value) {
        const warning = diagnostics.find(diagnostic => diagnostic.code.endsWith('AvisoValorExpressaoSeraConvertido') && diagnostic.from >= item.value.from && diagnostic.from <= item.value.to);
        if (warning) warning.fixes = [{ label: 'Usar real nesta declaração', source: code, changes: [{ from: node.from + type.index, to: node.from + type.index + 7, insert: 'real' }] }];
      }
    }
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
  }
  visit(program);
  const defaults = { inteiro: '0', real: '0.0', cadeia: '\"\"', caracter: "' '", logico: 'falso' };
  for (const diagnostic of diagnostics) if ((/NaoInicializ|NaoTerSidoInicializada/.test(diagnostic.code))) {
    const name = code.slice(diagnostic.from, diagnostic.to);
    const candidates = symbols.flatMap(symbol => symbol.kind === 'function' ? symbol.children : [symbol]).filter(symbol => symbol.name === name && !symbol.value && !symbol.dimensions?.length && !symbol.parameter && defaults[symbol.type]);
    if (candidates.length === 1) { const symbol = candidates[0]; diagnostic.fixes = [{ label: `Inicializar ${name} com ${defaults[symbol.type]}`, source: code, changes: [{ from: symbol.to, to: symbol.to, insert: ` = ${defaults[symbol.type]}` }] }]; }
  }
  return { diagnostics: diagnostics.map(item => ({ ...item, from: Math.max(0, Math.min(item.from, code.length)), to: Math.max(0, Math.min(item.to, code.length)) })).sort((a, b) => a.from - b.from), symbols };
}
