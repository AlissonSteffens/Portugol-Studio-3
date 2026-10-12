import { librarySignature } from './library-signatures.js';
import { diagnostic, diagnosticError, lexicalDiagnostics, reservedWords } from './diagnostics.js';
import { semanticDiagnostics } from './semantic-analysis.js';
import contracts, { libraryConstants } from './library-contracts.js';
const TYPES = new Set(['inteiro', 'real', 'cadeia', 'caracter', 'logico', 'vazio']);
const PRECEDENCE = { '=': 1, '+=': 1, '-=': 1, '*=': 1, '/=': 1, '%=': 1, 'ou': 2, 'e': 3, '|': 4, '^': 5, '&': 6, '==': 7, '!=': 7, '<': 8, '>': 8, '<=': 8, '>=': 8, '<<': 9, '>>': 9, '>>>': 9, '+': 10, '-': 10, '*': 11, '/': 11, '%': 11 };
const literal = value => JSON.stringify(value);

class Parser {
  constructor(tokens, options = {}) { let offset = 0, line = 1; tokens = tokens.map(token => { const positioned = { ...token, line, from: offset, to: offset + token.value.length }; offset = positioned.to; line += (token.value.match(/\n/g) || []).length; return positioned; }); this.tokens = tokens.filter(t => !['whitespace', 'comment'].includes(t.type)); this.index = 0; this.options = options; this.diagnostics = options.diagnostics || []; }
  peek() { return this.tokens[this.index]?.value; }
  take() { const token = this.tokens[this.index++]; if (!token) throw new Error('Fim inesperado do programa.'); return token; }
  accept(value) { if (this.peek() !== value) return false; this.index++; return true; }
  fail(id, message, token = this.tokens[this.index] || this.tokens.at(-1)) { throw diagnosticError(diagnostic('ErroSintatico.' + id, token, message)); }
  expect(value) {
    if (this.accept(value)) return;
    if (this.peek() === 'senao') this.fail('ErroSenaoInesperado', 'O comando senao deve aparecer após um comando se.');
    const id = value === 'programa' || value === 'biblioteca' || value === 'enquanto' ? 'ErroPalavraReservadaEstaFaltando' : value === '}' || value === '{' ? 'ErroEscopo' : value === '(' || value === ')' || value === ']' ? 'ErroParentesis' : value === ':' ? 'ErroFaltaDoisPontos' : 'ErroTokenFaltando';
    this.fail(id, `Era esperado “${value}”, mas foi encontrado “${this.peek() || 'fim do arquivo'}”. ${value === '}' ? 'Feche o bloco com }.' : value === ':' ? 'Insira : após o caso.' : ''}`);
  }
  name(context = 'variável') {
    const token = this.tokens[this.index];
    if (!token || ['(', ')', '{', '}', ',', ';', '='].includes(token.value)) this.fail('ErroNomeSimboloEstaFaltando', `O nome ${context === 'função' ? 'da função' : context === 'parâmetro' ? 'do parâmetro' : 'da variável'} não foi informado.`);
    if (token.value === '[' || token.value === ']') this.fail('ErroChaveDeVetorMatrizMalPosicionada', 'As dimensões do vetor ou matriz devem aparecer após o nome: inteiro a[] = {2, 3}.');
    if (token.type === 'number' && this.tokens[this.index - 1]?.value === ',' && this.tokens[this.index - 2]?.type === 'number') this.fail('ErroRealComVirgula', 'Valores reais devem ser escritos com pontos, por exemplo 2.75, e não com vírgulas.');
    if (token.type !== 'ident' || reservedWords.has(token.value)) this.fail('ErroNomeIncompativel', `“${token.value}” não é um nome válido. Utilize letras, números e sublinhado; não comece com números nem utilize palavras reservadas.`);
    this.index++; return token;
  }
  recover(start) {
    if (this.index <= start && this.peek() !== '}') this.index++;
    const line = this.tokens[start]?.line;
    while (this.peek() && this.peek() !== '}') {
      if (this.accept(';')) break;
      if (this.tokens[this.index].line > line && (TYPES.has(this.peek()) || ['const', 'funcao', 'se', 'para', 'enquanto', 'escreva', 'leia', 'retorne'].includes(this.peek()))) break;
      this.index++;
    }
  }
  type(parameter = false) { if (!TYPES.has(this.peek())) this.fail(parameter ? 'ErroParametrosNaoTipados' : 'ErroTipoDeDadoEstaFaltando', parameter ? 'Informe o tipo de cada parâmetro, por exemplo funcao nome(inteiro idade).' : 'Você esqueceu de informar o tipo de dado da variável.'); return this.take().value; }
  dimensions() { const dimensions = []; while (this.accept('[')) { dimensions.push(this.peek() === ']' ? null : this.expression()); this.expect(']'); } return dimensions; }
  program() {
    if (this.peek() !== 'programa' && this.tokens.some(token => token.value === 'programa')) this.fail('ErroExpressoesForaEscopoPrograma', 'Não são permitidas expressões antes da palavra programa.');
    this.expect('programa'); this.expect('{'); const globals = [], functions = [], libraries = Object.create(null), inclusions = [];
    while (this.peek() !== '}' && this.peek()) {
      if (this.accept('inclua')) {
        this.expect('biblioteca'); const token = this.name(), library = token.value;
        const alias = this.accept('-->') ? this.name().value : library;
        libraries[alias] = library; inclusions.push({ library, alias, from: token.from, to: this.tokens[this.index - 1].to });
      } else if (this.accept('funcao')) {
        const type = TYPES.has(this.peek()) ? this.type() : 'vazio', dimensions = this.dimensions();
        const token = this.name('função'), name = token.value, parameters = []; this.expect('(');
        if (this.peek() !== ')') do {
          const type = this.type(true), ref = this.accept('&'), token = this.name('parâmetro'), name = token.value, dimensions = this.dimensions();
          parameters.push({ name, type, ref, dimensions, from: token.from, to: token.to });
        } while (this.accept(','));
        this.expect(')'); functions.push({ name, from: token.from, to: token.to, type, dimensions, parameters, body: this.statement() });
      } else if (this.accept(';')) { /* Separador opcional. */ }
      else { if (!TYPES.has(this.peek()) && this.peek() !== 'const') this.fail('ErroExpressaoForaEscopoFuncao', 'Esta expressão está fora do escopo de uma função e nunca será executada. Mova-a para uma função.'); globals.push(this.declaration()); }
    }
    this.expect('}'); if (this.peek()) this.fail('ErroExpressoesForaEscopoPrograma', 'Não são permitidas expressões após o fechamento do programa.');
    return { globals, functions, libraries, inclusions };
  }
  declaration() {
    const from = this.tokens[this.index]?.from;
    const constant = this.accept('const'), type = this.type(), items = [];
    do { const token = this.name(), name = token.value, dimensions = this.dimensions(), value = this.accept('=') ? this.expression() : null; items.push({ name, type, constant, dimensions, value, from: token.from, to: token.to }); } while (this.accept(','));
    this.accept(';'); return { kind: 'declaration', items, from, to: this.tokens[this.index - 1]?.to };
  }
  describeError(error) {
    return { code: error.code || 'ErroSintatico.ErroParsingNaoTratado', from: error.from ?? this.tokens[this.index]?.from ?? this.tokens.at(-1)?.from ?? 0, to: error.to ?? this.tokens[this.index]?.to ?? this.tokens.at(-1)?.to ?? 1, severity: 'error', message: error.message };
  }
  statement() {
    const token = this.tokens[this.index];
    try { const node = this.readStatement(); return { ...node, from: token?.from, to: this.tokens[this.index - 1]?.to }; }
    catch (error) { error.from ??= this.tokens[this.index]?.from ?? token?.from; error.to ??= this.tokens[this.index]?.to ?? token?.to; throw error; }
  }
  readStatement() {
    if (!this.peek() || this.peek() === '}') this.fail('ErroComandoEsperado', 'Esta construção espera um comando ou um bloco entre { e }.');
    if (this.tokens[this.index]?.type === 'ident' && this.tokens[this.index + 1]?.value === ':') { const name = this.take().value; this.take(); return { kind: 'unsupported', name: 'rótulo ' + name }; }
    if (this.accept('{')) {
      const statements = []; while (this.peek() !== '}') {
        if (!this.peek()) this.fail('ErroEscopo', 'O bloco não foi fechado corretamente. Insira } para corrigir o problema.');
        const start = this.index;
        try { statements.push(this.statement()); }
        catch (error) { if (!this.options.recover) throw error; this.diagnostics.push(this.describeError(error)); this.recover(start); }
      }
      this.expect('}'); return { kind: 'block', statements };
    }
    if (this.accept(';')) return { kind: 'empty' };
    if (this.peek() === 'senao') this.fail('ErroSenaoInesperado', 'O comando senao deve ser utilizado após um comando se.');
    if (['continue', 'va_para'].includes(this.peek()) && this.tokens[this.index + 1]?.value !== '=') { const name = this.take().value; if (name === 'va_para' && this.peek() !== '}') this.name(); this.accept(';'); return { kind: 'unsupported', name }; }
    if (this.peek() === 'const' || TYPES.has(this.peek())) return this.declaration();
    if (this.accept('se')) { this.expect('('); const condition = this.expression(); this.expect(')'); const yes = this.statement(), no = this.accept('senao') ? this.statement() : null; return { kind: 'if', condition, yes, no }; }
    if (this.accept('enquanto')) { this.expect('('); const condition = this.expression(); this.expect(')'); return { kind: 'while', condition, body: this.statement() }; }
    if (this.accept('faca')) { const body = this.statement(); this.expect('enquanto'); this.expect('('); const condition = this.expression(); this.expect(')'); this.accept(';'); return { kind: 'do', condition, body }; }
    if (this.accept('para')) {
      this.expect('('); if (this.peek() === ')') this.fail('ErroParaEsperaCondicao', 'O comando para necessita de uma condição de parada: para (; condicao;).'); let init;
      if (TYPES.has(this.peek()) || this.peek() === 'const') init = this.declaration();
      else { init = this.peek() === ';' ? null : this.expression(); this.expect(';'); }
      const condition = this.peek() === ';' ? null : this.expression(); this.expect(';');
      const update = this.peek() === ')' ? null : this.expression(); this.expect(')'); return { kind: 'for', init, condition, update, body: this.statement() };
    }
    if (this.accept('escolha')) {
      this.expect('('); const value = this.expression(); this.expect(')'); this.expect('{'); const cases = [];
      while (this.peek() !== '}') {
        this.expect('caso'); const value = this.accept('contrario') ? null : this.expression(); this.expect(':'); const statements = [];
        while (this.peek() !== 'caso' && this.peek() !== '}') statements.push(this.statement());
        cases.push({ value, statements });
      }
      this.expect('}'); return { kind: 'switch', value, cases };
    }
    if (this.accept('pare')) { this.accept(';'); return { kind: 'break' }; }
    if (this.accept('retorne')) {
      const value = this.peek() === '}' || this.peek() === ';' ? null : this.expression(); this.accept(';'); return { kind: 'return', value };
    }
    const value = this.expression(); this.accept(';'); return { kind: 'expression', value };
  }
  expression(minimum = 1) {
    const token = this.tokens[this.index]; const node = this.readExpression(minimum);
    return { ...node, from: token?.from, to: this.tokens[this.index - 1]?.to };
  }
  readExpression(minimum = 1) {
    let left;
    if (['-', '+', 'nao', '!', '~', '++', '--'].includes(this.peek())) { const op = this.take().value; left = { kind: 'unary', op, value: this.expression(12) }; }
    else if (this.accept('(')) { left = this.expression(); this.expect(')'); }
    else if (this.accept('{')) {
      const items = []; if (this.peek() !== '}') do { items.push(this.expression()); } while (this.accept(',')); this.expect('}'); left = { kind: 'array', items };
    } else {
      if (!this.peek() || [')', '}', ']', ';', ','].includes(this.peek())) this.fail(this.tokens[this.index - 1]?.type === 'op' ? 'ErroExpressaoIncompleta' : 'ErroExpressaoEsperada', 'A expressão está incompleta. Informe um valor ou expressão antes deste símbolo.');
      const token = this.take();
      if (['number', 'string', 'char'].includes(token.type) || ['verdadeiro', 'falso'].includes(token.value)) left = { kind: 'literal', token };
      else if (token.type === 'ident') left = { kind: 'name', name: token.value };
      else this.fail('ErroExpressaoInesperada', `A expressão “${token.value}” não era esperada neste local.`, token);
    }
    const start = this.tokens[this.index - 1];
    left.from ??= left.token?.from ?? start?.from; left.to ??= start?.to;
    while (true) {
      const from = left.from;
      if (this.accept('.')) left = { kind: 'member', object: left, name: this.take().value };
      else if (this.accept('[')) { const index = this.expression(); this.expect(']'); left = { kind: 'index', object: left, index }; }
      else if (this.accept('(')) {
        const args = []; if (this.peek() !== ')') do { args.push(this.expression()); } while (this.accept(',')); this.expect(')'); left = { kind: 'call', target: left, args };
      } else if (['++', '--'].includes(this.peek())) left = { kind: 'postfix', op: this.take().value, value: left };
      else {
        const op = this.peek(), precedence = PRECEDENCE[op];
        if (!precedence || precedence < minimum) break;
        this.take(); const right = this.expression(precedence + (precedence === 1 ? 0 : 1)); left = { kind: 'binary', op, left, right };
      }
      left.from ??= from; left.to = this.tokens[this.index - 1]?.to;
    }
    return left;
  }
}

class Generator {
  constructor(program, options = {}) {
    this.inspect = options.inspect; this.debug = options.debug;
    this.program = program; this.scopes = [new Map()]; this.currentFunction = null;
    this.functions = new Map(program.functions.map(fn => [fn.name, fn]));
    this.libraries = program.libraries;
    for (const declaration of program.globals) for (const item of declaration.items) this.declare(item).initialized = false;
  }
  declare(item) {
    const scope = this.scopes.at(-1);
    if (scope.has(item.name)) throw new Error('Símbolo já declarado: ' + item.name);
    const symbol = { ...item, dimensions: item.dimensions.length, code: '__v_' + item.name };
    scope.set(item.name, symbol); return symbol;
  }
  lookup(name) { for (let i = this.scopes.length - 1; i >= 0; i--) if (this.scopes[i].has(name)) return this.scopes[i].get(name); throw new Error('Símbolo não declarado: ' + name); }
  cast(code, type, dimensions = 0) { return dimensions ? code : `__runtime.cast(${code}, ${literal(type)})`; }
  convert(node, type, dimensions = 0) {
    const value = this.expression(node);
    return this.cast(value.code, type, dimensions);
  }
  ref(expression) {
    const value = this.expression(expression, true);
    if (!value.assignable || value.constant) throw new Error('Parâmetro por referência exige uma variável modificável.');
    if (expression.kind === 'index') return value.code.slice(0, -6);
    return `__runtime.reference(() => __runtime.readValue(${value.code}, ${literal(expression.name || 'referência')}, ${expression.from || 0}, ${expression.to || 0}), __value => ${value.code} = ${this.cast('__value', value.type, value.dimensions)})`;
  }
  expression(node, write = false) {
    try {
      const value = this.readExpression(node);
      if (!write && node.kind === 'name' && !value.dimensions) value.code = `__runtime.readValue(${value.code}, ${literal(node.name)}, ${node.from || 0}, ${node.to || 0})`;
      return value;
    } catch (error) { error.from ??= node.from; error.to ??= node.to; throw error; }
  }
  readExpression(node) {
    const result = (code, type = 'inteiro', dimensions = 0, extra = {}) => ({ code, type, dimensions, ...extra });
    switch (node.kind) {
      case 'literal': {
        const { type, value } = node.token;
        if (value === 'verdadeiro' || value === 'falso') return result(value === 'verdadeiro' ? 'true' : 'false', 'logico');
        if (type === 'number') return result(/^0x/i.test(value) ? String(Number(value) | 0) : value, /[.eE]/.test(value) && !/^0x/i.test(value) ? 'real' : 'inteiro');
        // Literais usam os mesmos escapes de JavaScript; aspas simples representam caracteres.
        return result(value, type === 'char' ? 'caracter' : 'cadeia');
      }
      case 'name': {
        const symbol = this.lookup(node.name); return result(symbol.code + (symbol.ref ? '.value' : ''), symbol.type, symbol.dimensions, { assignable: true, constant: symbol.constant });
      }
      case 'array': {
        const items = node.items.map(item => this.expression(item));
        return result('[' + items.map(item => item.code).join(',') + ']', items[0]?.type || 'inteiro', (items[0]?.dimensions || 0) + 1);
      }
      case 'index': {
        const object = this.expression(node.object), index = this.expression(node.index);
        return result(`__runtime.element(${object.code}, ${index.code}, ${object.dimensions > 1 || node.object.kind === 'index'}, ${node.from || 0}, ${node.to || 0}).value`, object.type, Math.max(0, object.dimensions - 1), { assignable: true, constant: object.constant });
      }
      case 'member': {
        if (node.object.kind !== 'name' || !this.libraries[node.object.name]) throw new Error('Biblioteca desconhecida.');
        const library = this.libraries[node.object.name];
        return result(`__runtime.${library}.${node.name}`, libraryConstants[library]?.[node.name]?.type || 'inteiro');
      }
      case 'call': {
        if (node.target.kind === 'name') {
          const name = node.target.name;
          if (name === 'leia') {
            return result('(' + node.args.map(arg => { const value = this.expression(arg, true); if (!value.assignable || value.constant) throw new Error('leia exige uma variável modificável.'); return `${value.code} = ${this.cast(`await __runtime.leia(${literal(value.type)})`, value.type, value.dimensions)}`; }).join(',') + ')', 'vazio');
          }
          if (name === 'sorteia') return result(`__runtime.Util.sorteia(${node.args.map(arg => this.expression(arg).code).join(',')})`);
          if (['escreva', 'limpa'].includes(name)) return result(`(await __runtime.${name}(${node.args.map(arg => this.expression(arg).code).join(',')}))`, 'vazio');
          const fn = this.functions.get(name); if (!fn) throw new Error('Função desconhecida: ' + name);
          if (node.args.length !== fn.parameters.length) throw new Error('Quantidade de parâmetros inválida: ' + name);
          const args = node.args.map((arg, i) => { const parameter = fn.parameters[i]; return parameter.ref ? this.ref(arg) : this.convert(arg, parameter.type, parameter.dimensions.length); });
          return result(`(await __fn_${name}(${args.join(',')}))`, fn.type, fn.dimensions.length);
        }
        const member = node.target, library = this.libraries[member.object?.name];
        const contract = librarySignature(library, member.name);
        if (!contract) throw new Error('Método de biblioteca desconhecido: ' + library + '.' + member.name);
        const args = node.args.map((arg, i) => { const value = this.expression(arg), parameter = contract.parameters[i]; return parameter ? this.cast(value.code, parameter.type, parameter.dimensions) : value.code; });
        const call = `(await __runtime.callLibrary(${literal(library)}, ${literal(member.name)}, [${args.join(',')}], ${node.from || 0}, ${node.to || 0}))`;
        if (library === 'Objetos' && member.name === 'atribuir_propriedade' && node.args.length === 3) {
          const type = this.expression(node.args[2]).type;
          return result(`(await __runtime.setObjectProperty([${args.join(',')}], ${literal(type)}, ${node.from || 0}, ${node.to || 0}))`, contract.type);
        }
        return result(call, contract.type);
      }
      case 'unary': case 'postfix': {
        const op = node.op === 'nao' ? '!' : node.op, value = this.expression(node.value, ['++', '--'].includes(op));
        if (['++', '--'].includes(op) && (!value.assignable || value.constant)) throw new Error('Incremento exige uma variável modificável.');
        if (['++', '--'].includes(op)) return result(`__runtime.increment(${this.ref(node.value)}, ${op === '++' ? 1 : -1}, ${node.kind === 'postfix'})`, value.type);
        return result(node.kind === 'postfix' ? `(${value.code}${op})` : `(${op}${value.code})`, op === '!' ? 'logico' : value.type);
      }
      case 'binary': {
        const op = node.op, left = this.expression(node.left, PRECEDENCE[op] === 1), right = this.expression(node.right);
        if (PRECEDENCE[op] === 1) {
          if (!left.assignable || left.constant) throw new Error('Atribuição exige uma variável modificável.');
          const convertedValue = op === '=' ? { ...right, code: '__right' } : this.operation(op[0], { ...left, code: '__target.value' }, { ...right, code: '__right' }, node);
          const value = convertedValue.code;
          return result(`((__target, __right) => (__target.value = ${this.cast(value, left.type, left.dimensions)}))(${this.ref(node.left)}, ${right.code})`, left.type, left.dimensions);
        }
        return this.operation(op, left, right, node);
      }
      default: throw new Error('Expressão não implementada: ' + node.kind);
    }
  }
  operation(op, left, right, node) {
    const type = ['e', 'ou', '==', '!=', '<', '>', '<=', '>='].includes(op) ? 'logico' : left.type === 'real' || right.type === 'real' ? 'real' : 'inteiro';
    if (op === '+' && ([left.type, right.type].includes('cadeia') || (left.type === 'caracter' && right.type === 'caracter'))) return { code: `(__runtime.stringify(${left.code}) + __runtime.stringify(${right.code}))`, type: 'cadeia', dimensions: 0 };
    if (op === '+' && left.type === 'logico' && right.type === 'logico') return { code: `(${left.code} || ${right.code})`, type: 'logico', dimensions: 0 };
    if (op === '/' || op === '%') return { code: `__runtime.divide(${left.code}, ${right.code}, ${type === 'inteiro'}, ${op === '%'}, ${node?.from || 0}, ${node?.to || 0})`, type, dimensions: 0 };
    const operator = { e: '&&', ou: '||', '==': '===', '!=': '!==' }[op] || op;
    return { code: `(${left.code} ${operator} ${right.code})`, type, dimensions: 0 };
  }
  snapshot(node) {
    const symbols = this.scopes.flatMap(scope => [...scope.values()]).filter(symbol => symbol.initialized !== false);
    return `__runtime.inspect?.(${JSON.stringify(this.currentFunction?.name || 'programa')}, ${node.from || 0}, [${symbols.map(symbol => `{name:${literal(symbol.name)},from:${symbol.from || 0},type:${literal(symbol.type)},value:(() => { try { return ${symbol.code}${symbol.ref ? '.value' : ''}; } catch { return undefined; } })()}`).join(',')}]);`;
  }
  statement(node, globals = false) {
    try {
      const before = this.debug && !['block', 'empty', 'while', 'for', 'do'].includes(node.kind) ? this.snapshot(node) + `await __runtime.debugger?.checkpoint(${node.from || 0}, ${node.to || (node.from || 0) + 1});` : '';
      const code = this.readStatement(node, globals);
      const location = before + `__runtime.sourcePosition = ${node.from || 0}; __runtime.sourceEnd = ${node.to || (node.from || 0) + 1};`;
      if (['block', 'empty'].includes(node.kind)) return code;
      if (!this.inspect) return node.kind === 'declaration' ? location + code : '{' + location + code + '}';
      if (['break', 'return'].includes(node.kind)) return '{' + location + this.snapshot(node) + code + '}';
      return node.kind === 'declaration' ? location + code + this.snapshot(node) : '{' + location + this.snapshot(node) + code + this.snapshot(node) + '}';
    } catch (error) { error.from ??= node.from; error.to ??= node.to; throw error; }
  }
  readStatement(node, globals = false) {
    const expression = value => this.expression(value).code;
    const condition = value => this.debug ? `(await (async () => { ${this.snapshot(node)} await __runtime.debugger?.checkpoint(${node.from || 0}, ${node.to || 0}); return ${value ? expression(value) : 'true'}; })())` : value ? expression(value) : 'true';
    switch (node.kind) {
      case 'empty': return ';';
      case 'declaration': return node.items.map(item => {
        const symbol = globals ? this.lookup(item.name) : this.declare(item);
        let value;
        if (item.dimensions.length) {
          if (item.value) value = `__runtime.arrayFrom(${expression(item.value)}, ${literal(item.type)}, ${item.dimensions.length})`;
          else value = `__runtime.array([${item.dimensions.map(d => d ? expression(d) : '0').join(',')}], ${literal(item.type)})`;
        } else value = item.value ? this.convert(item.value, item.type) : globals ? `__runtime.defaultValue(${literal(item.type)})` : 'undefined';
        symbol.initialized = true;
        return `${item.constant ? 'const' : 'let'} ${symbol.code} = ${value};`;
      }).join('\n');
      case 'block': this.scopes.push(new Map()); { const code = '{\n' + node.statements.map(statement => this.statement(statement)).join('\n') + '\n}'; this.scopes.pop(); return code; }
      case 'expression': return expression(node.value) + ';';
      case 'if': return `if (${expression(node.condition)}) ${this.statement(node.yes)}${node.no ? ' else ' + this.statement(node.no) : ''}`;
      case 'while': return `while (${condition(node.condition)}) { await __runtime.checkInterrupt(); ${this.statement(node.body)} }`;
      case 'do': return `do { await __runtime.checkInterrupt(); ${this.statement(node.body)} } while (${condition(node.condition)});`;
      case 'for': {
        this.scopes.push(new Map());
        const init = node.init?.kind === 'declaration' ? this.readStatement(node.init).replace(/;\n(?:let|const) /g, ', ').replace(/;$/, '') : node.init ? expression(node.init) : '';
        const code = `for (${init}; ${condition(node.condition)}; ${node.update ? expression(node.update) : ''}) { await __runtime.checkInterrupt(); ${this.statement(node.body)} }`;
        this.scopes.pop(); return code;
      }
      case 'switch': return `switch (${expression(node.value)}) { ${node.cases.map(item => (item.value ? 'case ' + expression(item.value) : 'default') + ':\n' + item.statements.map(statement => this.statement(statement)).join('\n')).join('\n')} }`;
      case 'break': return 'break;';
      case 'return': return 'return' + (node.value ? ' ' + this.convert(node.value, this.currentFunction.type, this.currentFunction.dimensions.length) : '') + ';';
      default: throw new Error('Instrução não implementada: ' + node.kind);
    }
  }
  generate() {
    const globals = this.program.globals.map(node => this.statement(node, true)).join('\n');
    const functions = this.program.functions.map(fn => {
      this.currentFunction = fn; this.scopes.push(new Map()); for (const parameter of fn.parameters) this.declare(parameter);
      const entry = this.inspect ? this.snapshot(fn) : '';
      const body = this.statement(fn.body); this.scopes.pop();
      return `async function __fn_${fn.name}(${fn.parameters.map(p => '__v_' + p.name).join(',')}) { __runtime.enterFunction(${literal(fn.name)}); try { await __runtime.checkInterrupt(); ${entry}${body} } catch (__error) { throw __runtime.translateError(__error); } finally { __runtime.leaveFunction(); } }`;
    }).join('\n');
    return `return (async () => { try {\n${globals}\n${functions}\n${this.functions.has('inicio') ? (this.functions.get('inicio').parameters.length ? 'await __fn_inicio(__runtime.options.arguments || []);' : 'await __fn_inicio();') : ''}\n} catch (__error) { throw __runtime.translateError(__error); } })();`;
  }
}

export function analyzeTokens(tokens) {
  const diagnostics = lexicalDiagnostics(tokens), parser = new Parser(tokens, { recover: true, diagnostics });
  let program;
  try { program = parser.program(); } catch (error) { diagnostics.push(parser.describeError(error)); }
  if (program) { try { diagnostics.push(...semanticDiagnostics(program)); } catch (error) { console.error(error); diagnostics.push(diagnostic('ErroSemantico.ErroSemanticoNaoTratado', { from: 0, to: 1 }, 'Não foi possível concluir a análise deste código. Verifique estruturas muito profundas ou expressões excessivamente complexas.')); } }
  return { program, diagnostics };
}

export function compile(tokens, options = {}) {
  const { program, diagnostics } = analyzeTokens(tokens);
  options.diagnostics?.push(...diagnostics);
  const errors = diagnostics.filter(item => item.severity === 'error');
  if (errors.length) throw diagnosticError(errors[0], diagnostics);
  return new Generator(program, { ...options, diagnostics: undefined }).generate();
}
export function parseProgram(tokens) { return new Parser(tokens).program(); }
