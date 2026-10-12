import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { pickedCompletion } from '@codemirror/autocomplete';
import { tokenize } from '../../js/transpiler.js';
import contracts, { libraryConstants } from '../../js/library-contracts.js';

const TYPES = new Set(['inteiro', 'real', 'cadeia', 'caracter', 'logico', 'vazio']);
const KEYWORDS = ['programa', 'funcao', 'inicio', 'inclua', 'biblioteca', 'const', 'se', 'senao', 'enquanto', 'faca', 'para', 'escolha', 'caso', 'contrario', 'pare', 'retorne', 'e', 'ou', 'nao'];

export const portugolLanguage = StreamLanguage.define({
  name: 'portugol',
  startState: () => ({ comment: false, quote: null, indent: 0 }),
  token(stream, state) {
    if (state.comment) { while (!stream.eol()) if (stream.match('*/')) { state.comment = false; break; } else stream.next(); return 'comment'; }
    if (stream.eatSpace()) return null;
    if (stream.match('//')) { stream.skipToEnd(); return 'comment'; }
    if (stream.match('/*')) { state.comment = true; return 'comment'; }
    if (stream.peek() === '"' || stream.peek() === "'") {
      const quote = stream.next(); let escaped = false;
      while (!stream.eol()) { const char = stream.next(); if (char === quote && !escaped) break; if (char === '\\' && !escaped) escaped = true; else escaped = false; }
      return 'string';
    }
    if (stream.match(/^(?:0x[\da-fA-F]+|\d+(?:\.\d+)?)/)) return 'number';
    if (stream.match(/^[\p{L}_][\p{L}\p{N}_]*/u)) {
      const word = stream.current();
      if (TYPES.has(word)) return 'typeName';
      if (KEYWORDS.includes(word)) return 'keyword';
      if (['verdadeiro', 'falso'].includes(word)) return 'bool';
      if (/^[A-Z][A-Z_0-9]+$/.test(word)) return 'variableName.constant';
      return stream.match(/^\s*\(/, false) ? 'variableName.function' : 'variableName';
    }
    const char = stream.next(); if (char === '{') state.indent++; if (char === '}') state.indent = Math.max(0, state.indent - 1);
    return /[+\-*/%=<>!&|^~]/.test(char) ? 'operator' : null;
  },
  indent: (state, textAfter) => Math.max(0, state.indent - (textAfter.trimStart().startsWith('}') ? 1 : 0)) * 4,
  languageData: { commentTokens: { line: '//', block: { open: '/*', close: '*/' } }, closeBrackets: { brackets: ['(', '[', '{', '"', "'"] } },
});
export const portugolHighlight = syntaxHighlighting(HighlightStyle.define([
  { tag: tags.keyword, color: '#00aaff' }, { tag: tags.typeName, color: '#00aaff' },
  { tag: tags.string, color: '#ce9178' }, { tag: tags.comment, color: '#6a9955' },
  { tag: tags.number, color: '#b5cea8' }, { tag: tags.bool, color: '#00aaff' },
  { tag: tags.function(tags.variableName), color: '#dcdcaa' }, { tag: tags.constant(tags.variableName), color: '#00d4d4' },
]));

function positionedTokens(source) {
  let offset = 0;
  return tokenize(source).map(token => { const result = { ...token, from: offset, to: offset + token.value.length }; offset = result.to; return result; });
}
function matching(tokens, start, open, close) {
  let depth = 0;
  for (let i = start; i < tokens.length; i++) { if (tokens[i].value === open) depth++; if (tokens[i].value === close && --depth === 0) return i; }
  return tokens.length;
}
export function analyzeSymbols(source, position) {
  const tokens = positionedTokens(source).filter(token => !['comment', 'whitespace'].includes(token.type));
  const scopes = [{ from: 0, to: source.length + 1, depth: 0 }], stack = [scopes[0]];
  for (const token of tokens) {
    if (token.value === '{') { const scope = { from: token.from, to: source.length + 1, depth: stack.length }; scopes.push(scope); stack.push(scope); }
    if (token.value === '}' && stack.length > 1) stack.pop().to = token.to;
  }
  const scopeAt = offset => scopes.filter(scope => scope.from <= offset && scope.to >= offset).sort((a, b) => b.depth - a.depth)[0];
  const variables = [], functions = [], imports = {}, ignored = new Set();
  let programBrace = null, importEnd = null;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].value === 'programa' && tokens[i + 1]?.value === '{') programBrace = tokens[i + 1].to;
    if (tokens[i].value === 'inclua' && tokens[i + 1]?.value === 'biblioteca') {
      const name = tokens[i + 2]?.value;
      const alias = tokens[i + 3]?.value === '-->' ? tokens[i + 4]?.value : name;
      if (name && alias) { imports[name] = alias; importEnd = tokens[tokens[i + 3]?.value === '-->' ? i + 4 : i + 2].to; }
    }
    if (tokens[i].value !== 'funcao') continue;
    let cursor = i + 1, type = 'vazio';
    if (TYPES.has(tokens[cursor]?.value)) { ignored.add(cursor); type = tokens[cursor++].value; }
    while (tokens[cursor]?.value === '[' || tokens[cursor]?.value === ']') cursor++;
    const name = tokens[cursor]?.value, open = cursor + 1;
    if (tokens[open]?.value !== '(') continue;
    const close = matching(tokens, open, '(', ')'), body = tokens[close + 1];
    const scope = body?.value === '{' ? scopeAt(body.from + 1) : { from: tokens[open].from, to: source.length + 1, depth: 1 };
    const parameters = [];
    for (let j = open + 1; j < Math.min(close, tokens.length); j++) {
      if (!TYPES.has(tokens[j].value)) continue;
      ignored.add(j); const index = j + (tokens[j + 1]?.value === '&' ? 2 : 1), parameter = tokens[index];
      if (parameter?.type !== 'ident') continue;
      let dimensions = ''; for (let k = index + 1; tokens[k]?.value === '['; k += 2) dimensions += '[]';
      parameters.push({ name: parameter.value, type: tokens[j].value + dimensions });
      variables.push({ name: parameter.value, type: tokens[j].value + dimensions, scope, from: scope.from, parameter: true });
    }
    functions.push({ name, type, parameters });
  }
  for (let i = 0; i < tokens.length; i++) {
    if (!TYPES.has(tokens[i].value) || ignored.has(i)) continue;
    let cursor = i + 1;
    if (tokens[cursor]?.type !== 'ident') continue;
    let scope = scopeAt(tokens[i].from);
    // O contador do para pertence ao laço, inclusive quando o corpo não tem chaves.
    if (tokens[i - 1]?.value === '(' && tokens[i - 2]?.value === 'para') {
      const close = matching(tokens, i - 1, '(', ')');
      if (tokens[close + 1]?.value === '{') scope = { ...scopeAt(tokens[close + 1].from + 1), from: tokens[i].from };
    }
    while (cursor < tokens.length && tokens[cursor]?.type === 'ident') {
      const name = tokens[cursor], constant = tokens[i - 1]?.value === 'const';
      let dimensions = '', depth = 0, j = cursor + 1;
      while (tokens[j]?.value === '[') { dimensions += '[]'; j = matching(tokens, j, '[', ']') + 1; }
      variables.push({ name: name.value, type: tokens[i].value + dimensions, scope, from: name.from, constant });
      for (; j < tokens.length; j++) {
        const value = tokens[j].value;
        if (depth === 0 && (value === ';' || value === ')' || value === '}' || source.slice(tokens[j - 1]?.to, tokens[j].from).includes('\n'))) break;
        if (depth === 0 && value === ',') break;
        if (['(', '[', '{'].includes(value)) depth++;
        if ([')', ']', '}'].includes(value)) depth--;
      }
      if (tokens[j]?.value !== ',') break;
      cursor = j + 1;
    }
  }
  const visible = new Map();
  variables.filter(variable => (variable.from <= position || variable.scope.depth === 1) && variable.scope.from <= position && variable.scope.to > position).sort((a, b) => a.scope.depth - b.scope.depth).forEach(variable => visible.set(variable.name, variable));
  return { variables: [...visible.values()], functions, imports, programBrace, importEnd };
}

function applySymbol(name, parameters = [], library, qualifier, memberOnly = false, constant = false) {
  return (view, completion, from, to) => {
    const source = view.state.doc.toString(), symbols = analyzeSymbols(source, from);
    const alias = library ? symbols.imports[library] || qualifier || library : '';
    const text = (library && !memberOnly ? alias + '.' : '') + name + (constant ? '' : '()');
    const changes = [{ from, to, insert: text }];
    if (library && !symbols.imports[library] && symbols.programBrace !== null) {
      const point = symbols.importEnd ?? symbols.programBrace;
      changes.push({ from: point, insert: '\n    inclua biblioteca ' + library });
    }
    changes.sort((a, b) => a.from - b.from || (a.to ?? a.from) - (b.to ?? b.from));
    const changeSet = view.state.changes(changes);
    const anchor = changeSet.mapPos(to, 1) - (!constant && parameters.length ? 1 : 0);
    view.dispatch({ changes: changeSet, selection: { anchor }, annotations: pickedCompletion.of(completion), userEvent: 'input.complete', scrollIntoView: true });
  };
}
const parameterType = parameter => (parameter.type === 'vazio' ? 'qualquer' : parameter.type) + '[]'.repeat(parameter.dimensions || 0);
const signature = (name, contract) => `${contract.type} ${name}(${contract.parameters.map(parameter => parameterType(parameter) + ' ' + parameter.name).join(', ')})`;
function members(library, qualifier, memberOnly, imported) {
  const methods = Object.entries(contracts[library] || {}).filter(([, value]) => value.available).map(([name, contract]) => ({
    label: name, type: 'function', detail: library + ' · ' + contract.type,
    info: () => libraryDocumentation(library, name, contract, !imported),
    apply: applySymbol(name, contract.parameters, library, qualifier, memberOnly),
  }));
  const constants = Object.entries(libraryConstants[library] || {}).map(([name, contract]) => ({ label: name, type: 'constant', detail: library + ' · ' + contract.type, info: () => libraryDocumentation(library, name, contract), apply: applySymbol(name, [], library, qualifier, memberOnly, true) }));
  return [...methods, ...constants];
}
export function libraryDocumentation(library, name, contract, autoImport = false) {
  const dom = document.createElement('div'); dom.className = 'portugol-doc-tooltip';
  const add = (tag, text, parent = dom) => { const element = document.createElement(tag); element.textContent = text; parent.append(element); return element; };
  add('strong', library + '.' + name);
  if (!contract.parameters) {
    add('code', contract.type + ' ' + name);
    add('p', contract.description || 'Constante da biblioteca ' + library + '.');
    return dom;
  }
  add('code', signature(name, contract));
  if (contract.description) add('p', contract.description);
  if (contract.parameters.length) {
    add('h4', 'Parâmetros');
    for (const parameter of contract.parameters) {
      const row = add('p', '');
      add('b', parameter.name + ' · ' + parameterType(parameter), row);
      if (parameter.description) add('span', parameter.description, row);
    }
  } else add('p', 'Não recebe parâmetros.');
  add('h4', 'Retorno · ' + contract.type);
  add('p', contract.returns || (contract.type === 'vazio' ? 'Não retorna um valor.' : 'Valor do tipo ' + contract.type + '.'));
  if (autoImport) add('small', 'A biblioteca será incluída automaticamente.');
  return dom;
}
export function portugolHover(view, position) {
  const source = view.state.doc.toString(), tokens = positionedTokens(source);
  const index = tokens.findIndex(token => token.from <= position && token.to >= position && token.type === 'ident');
  if (index < 0) return null;
  const significant = tokens.filter(token => !['space', 'comment'].includes(token.type) && token.value.trim());
  let memberIndex = significant.findIndex(token => token.from === tokens[index].from);
  if (significant[memberIndex + 1]?.value === '.') memberIndex += 2;
  if (significant[memberIndex - 1]?.value !== '.') return null;
  const qualifier = significant[memberIndex - 2]?.value, name = significant[memberIndex]?.value;
  const imports = analyzeSymbols(source, position).imports;
  const library = Object.keys(contracts).find(key => key === qualifier || imports[key] === qualifier);
  const contract = contracts[library]?.[name] || libraryConstants[library]?.[name];
  if (!contract || contract.parameters && !contract.available) return null;
  return { pos: significant[memberIndex - 2].from, end: significant[memberIndex].to, above: true, create: () => ({ dom: libraryDocumentation(library, name, contract) }) };
}
export function portugolCompletions(context) {
  const source = context.state.doc.toString(), position = context.pos;
  const current = positionedTokens(source).find(token => token.from < position && (token.to > position || token.to === position && (token.value.startsWith('//') || ['string', 'char'].includes(token.type) && !token.value.endsWith(token.value[0]))));
  if (current && ['comment', 'string', 'char'].includes(current.type)) return null;
  const symbols = analyzeSymbols(source, position), line = context.state.doc.lineAt(position), before = source.slice(line.from, position);
  if (/inclua\s+biblioteca\s+[\p{L}_]*$/u.test(before)) {
    const word = context.matchBefore(/[\p{L}_]*$/u);
    return { from: word.from, options: Object.keys(contracts).map(label => ({ label, type: 'namespace' })) };
  }
  if (/\b(?:inteiro|real|cadeia|caracter|logico)\s+[\p{L}_]*$/u.test(before)) return null;
  const member = before.match(/([\p{L}_][\p{L}\p{N}_]*)\.([\p{L}\p{N}_]*)$/u);
  if (member) {
    const library = Object.keys(contracts).find(name => name === member[1] || symbols.imports[name] === member[1]);
    if (!library) return null;
    return { from: position - member[2].length, options: members(library, member[1], true, !!symbols.imports[library]), validFor: /^[\p{L}\p{N}_]*$/u };
  }
  const word = context.matchBefore(/[\p{L}\p{N}_]*/u);
  if (!word || word.from === word.to && !context.explicit) return null;
  const options = [
    ...symbols.variables.map(variable => ({ label: variable.name, type: variable.constant ? 'constant' : 'variable', detail: variable.type + (variable.parameter ? ' · parâmetro' : ''), boost: 10 })),
    ...symbols.functions.map(fn => ({ label: fn.name, type: 'function', detail: fn.type + ' · função do programa', info: fn.name + '(' + fn.parameters.map(parameter => parameter.type + ' ' + parameter.name).join(', ') + ')', apply: applySymbol(fn.name, fn.parameters), boost: 8 })),
    ...['escreva', 'leia', 'limpa'].map(name => ({ label: name, type: 'function', detail: 'Portugol', apply: applySymbol(name, name === 'limpa' ? [] : [{}]), boost: 5 })),
    ...[...KEYWORDS, ...TYPES, 'verdadeiro', 'falso'].map(label => ({ label, type: 'keyword' })),
    ...Object.keys(contracts).map(label => ({ label, type: 'namespace', detail: 'biblioteca' })),
    ...Object.keys(contracts).flatMap(library => members(library, null, false, !!symbols.imports[library])),
  ];
  return { from: word.from, options, validFor: /^[\p{L}\p{N}_]*$/u };
}
