import contracts from './library-contracts.js';
const TYPES = new Set(['inteiro', 'real', 'cadeia', 'caracter', 'logico', 'vazio']);
const PRECEDENCE = { '=': 1, '+=': 1, '-=': 1, '*=': 1, '/=': 1, '%=': 1, 'ou': 2, 'e': 3, '|': 4, '^': 5, '&': 6, '==': 7, '!=': 7, '<': 8, '>': 8, '<=': 8, '>=': 8, '<<': 9, '>>': 9, '>>>': 9, '+': 10, '-': 10, '*': 11, '/': 11, '%': 11 };
const literal = value => JSON.stringify(value);

class Parser {
  constructor(tokens) { this.tokens = tokens.filter(t => !['whitespace', 'comment'].includes(t.type)); this.index = 0; }
  peek() { return this.tokens[this.index]?.value; }
  take() { const token = this.tokens[this.index++]; if (!token) throw new Error('Fim inesperado do programa.'); return token; }
  accept(value) { if (this.peek() !== value) return false; this.index++; return true; }
  expect(value) { if (!this.accept(value)) throw new Error(`Esperado ${value}, encontrado ${this.peek() || 'fim do arquivo'}.`); }
  type() { const type = this.take().value; if (!TYPES.has(type)) throw new Error('Tipo inválido: ' + type); return type; }
  dimensions() { const dimensions = []; while (this.accept('[')) { dimensions.push(this.peek() === ']' ? null : this.expression()); this.expect(']'); } return dimensions; }
  program() {
    this.expect('programa'); this.expect('{'); const globals = [], functions = [], libraries = {};
    while (this.peek() !== '}' && this.peek()) {
      if (this.accept('inclua')) {
        this.expect('biblioteca'); const library = this.take().value;
        libraries[this.accept('-->') ? this.take().value : library] = library;
      } else if (this.accept('funcao')) {
        const type = TYPES.has(this.peek()) ? this.type() : 'vazio', dimensions = this.dimensions();
        const name = this.take().value, parameters = []; this.expect('(');
        if (this.peek() !== ')') do {
          const type = this.type(), ref = this.accept('&'), name = this.take().value, dimensions = this.dimensions();
          parameters.push({ name, type, ref, dimensions });
        } while (this.accept(','));
        this.expect(')'); functions.push({ name, type, dimensions, parameters, body: this.statement() });
      } else if (this.accept(';')) { /* Separador opcional. */ }
      else globals.push(this.declaration());
    }
    this.expect('}'); if (this.peek()) throw new Error('Código fora do bloco programa.');
    return { globals, functions, libraries };
  }
  declaration() {
    const constant = this.accept('const'), type = this.type(), items = [];
    do { const name = this.take().value, dimensions = this.dimensions(), value = this.accept('=') ? this.expression() : null; items.push({ name, type, constant, dimensions, value }); } while (this.accept(','));
    this.accept(';'); return { kind: 'declaration', items };
  }
  statement() {
    if (this.accept('{')) {
      const statements = []; while (this.peek() !== '}') { if (!this.peek()) throw new Error('Bloco não foi fechado.'); statements.push(this.statement()); }
      this.expect('}'); return { kind: 'block', statements };
    }
    if (this.accept(';')) return { kind: 'empty' };
    if (this.peek() === 'const' || TYPES.has(this.peek())) return this.declaration();
    if (this.accept('se')) { this.expect('('); const condition = this.expression(); this.expect(')'); const yes = this.statement(), no = this.accept('senao') ? this.statement() : null; return { kind: 'if', condition, yes, no }; }
    if (this.accept('enquanto')) { this.expect('('); const condition = this.expression(); this.expect(')'); return { kind: 'while', condition, body: this.statement() }; }
    if (this.accept('faca')) { const body = this.statement(); this.expect('enquanto'); this.expect('('); const condition = this.expression(); this.expect(')'); this.accept(';'); return { kind: 'do', condition, body }; }
    if (this.accept('para')) {
      this.expect('('); let init;
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
    let left;
    if (['-', '+', 'nao', '!', '~', '++', '--'].includes(this.peek())) { const op = this.take().value; left = { kind: 'unary', op, value: this.expression(12) }; }
    else if (this.accept('(')) { left = this.expression(); this.expect(')'); }
    else if (this.accept('{')) {
      const items = []; if (this.peek() !== '}') do { items.push(this.expression()); } while (this.accept(',')); this.expect('}'); left = { kind: 'array', items };
    } else {
      const token = this.take();
      if (['number', 'string', 'char'].includes(token.type) || ['verdadeiro', 'falso'].includes(token.value)) left = { kind: 'literal', token };
      else if (token.type === 'ident') left = { kind: 'name', name: token.value };
      else throw new Error('Expressão inválida: ' + token.value);
    }
    while (true) {
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
    }
    return left;
  }
}

class Generator {
  constructor(program) {
    this.program = program; this.scopes = [new Map()]; this.currentFunction = null;
    this.functions = new Map(program.functions.map(fn => [fn.name, fn]));
    this.libraries = { ...Object.fromEntries(Object.keys(contracts).map(name => [name, name])), ...program.libraries };
    for (const declaration of program.globals) for (const item of declaration.items) this.declare(item);
  }
  declare(item) {
    const scope = this.scopes.at(-1);
    if (scope.has(item.name)) throw new Error('Símbolo já declarado: ' + item.name);
    const symbol = { ...item, dimensions: item.dimensions.length, code: '__v_' + item.name };
    scope.set(item.name, symbol); return symbol;
  }
  lookup(name) { for (let i = this.scopes.length - 1; i >= 0; i--) if (this.scopes[i].has(name)) return this.scopes[i].get(name); throw new Error('Símbolo não declarado: ' + name); }
  cast(code, type, dimensions = 0) { return dimensions ? code : `__runtime.cast(${code}, ${literal(type)})`; }
  ref(expression) {
    const value = this.expression(expression);
    if (!value.assignable || value.constant) throw new Error('Parâmetro por referência exige uma variável modificável.');
    return `__runtime.reference(() => ${value.code}, __value => ${value.code} = ${this.cast('__value', value.type, value.dimensions)})`;
  }
  expression(node) {
    const result = (code, type = 'inteiro', dimensions = 0, extra = {}) => ({ code, type, dimensions, ...extra });
    switch (node.kind) {
      case 'literal': {
        const { type, value } = node.token;
        if (value === 'verdadeiro' || value === 'falso') return result(value === 'verdadeiro' ? 'true' : 'false', 'logico');
        if (type === 'number') return result(value, /[.eE]/.test(value) && !/^0x/i.test(value) ? 'real' : 'inteiro');
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
        return result(`${object.code}[${index.code}]`, object.type, Math.max(0, object.dimensions - 1), { assignable: true, constant: object.constant });
      }
      case 'member': {
        if (node.object.kind !== 'name' || !this.libraries[node.object.name]) throw new Error('Biblioteca desconhecida.');
        const library = this.libraries[node.object.name];
        return result(`__runtime.${library}.${node.name}`, node.name === 'PI' ? 'real' : 'inteiro');
      }
      case 'call': {
        if (node.target.kind === 'name') {
          const name = node.target.name;
          if (name === 'leia') {
            return result('(' + node.args.map(arg => { const value = this.expression(arg); if (!value.assignable || value.constant) throw new Error('leia exige uma variável modificável.'); return `${value.code} = ${this.cast(`await __runtime.leia(${literal(value.type)})`, value.type, value.dimensions)}`; }).join(',') + ')', 'vazio');
          }
          if (['escreva', 'limpa'].includes(name)) return result(`(await __runtime.${name}(${node.args.map(arg => this.expression(arg).code).join(',')}))`, 'vazio');
          const fn = this.functions.get(name); if (!fn) throw new Error('Função desconhecida: ' + name);
          if (node.args.length !== fn.parameters.length) throw new Error('Quantidade de parâmetros inválida: ' + name);
          const args = node.args.map((arg, i) => { const parameter = fn.parameters[i]; return parameter.ref ? this.ref(arg) : this.cast(this.expression(arg).code, parameter.type, parameter.dimensions.length); });
          return result(`(await __fn_${name}(${args.join(',')}))`, fn.type, fn.dimensions.length);
        }
        const member = node.target, library = this.libraries[member.object?.name];
        const contract = contracts[library]?.[member.name];
        if (!contract) throw new Error('Método de biblioteca desconhecido: ' + library + '.' + member.name);
        const args = node.args.map((arg, i) => { const value = this.expression(arg), parameter = contract.parameters[i]; return parameter ? this.cast(value.code, parameter.type, parameter.dimensions) : value.code; });
        return result(`(await __runtime.${library}.${member.name}(${args.join(',')}))`, contract.type);
      }
      case 'unary': case 'postfix': {
        const value = this.expression(node.value), op = node.op === 'nao' ? '!' : node.op;
        if (['++', '--'].includes(op) && (!value.assignable || value.constant)) throw new Error('Incremento exige uma variável modificável.');
        return result(node.kind === 'postfix' ? `(${value.code}${op})` : `(${op}${value.code})`, op === '!' ? 'logico' : value.type);
      }
      case 'binary': {
        const left = this.expression(node.left), right = this.expression(node.right), op = node.op;
        if (PRECEDENCE[op] === 1) {
          if (!left.assignable || left.constant) throw new Error('Atribuição exige uma variável modificável.');
          const value = op === '=' ? right.code : this.operation(op[0], left, right).code;
          return result(`(${left.code} = ${this.cast(value, left.type, left.dimensions)})`, left.type, left.dimensions);
        }
        return this.operation(op, left, right);
      }
      default: throw new Error('Expressão não implementada: ' + node.kind);
    }
  }
  operation(op, left, right) {
    const type = ['e', 'ou', '==', '!=', '<', '>', '<=', '>='].includes(op) ? 'logico' : left.type === 'real' || right.type === 'real' ? 'real' : 'inteiro';
    if (['<', '>', '<=', '>='].includes(op) && [left.type, right.type].some(type => ['cadeia', 'caracter'].includes(type))) throw new Error('Comparação de texto aceita apenas == e !=.');
    if (op === '+' && [left.type, right.type].some(type => ['cadeia', 'caracter'].includes(type))) return { code: `(__runtime.stringify(${left.code}) + __runtime.stringify(${right.code}))`, type: 'cadeia', dimensions: 0 };
    if (op === '/' || op === '%') return { code: `__runtime.divide(${left.code}, ${right.code}, ${type === 'inteiro'}, ${op === '%'})`, type, dimensions: 0 };
    const operator = { e: '&&', ou: '||', '==': '===', '!=': '!==' }[op] || op;
    return { code: `(${left.code} ${operator} ${right.code})`, type, dimensions: 0 };
  }
  statement(node, globals = false) {
    const expression = value => this.expression(value).code;
    switch (node.kind) {
      case 'empty': return ';';
      case 'declaration': return node.items.map(item => {
        const symbol = globals ? this.lookup(item.name) : this.declare(item);
        let value;
        if (item.dimensions.length) {
          if (item.value) value = `__runtime.arrayFrom(${expression(item.value)}, ${literal(item.type)}, ${item.dimensions.length})`;
          else value = `__runtime.array([${item.dimensions.map(d => d ? expression(d) : '0').join(',')}], ${literal(item.type)})`;
        } else value = item.value ? this.cast(expression(item.value), item.type) : `__runtime.defaultValue(${literal(item.type)})`;
        return `${item.constant ? 'const' : 'let'} ${symbol.code} = ${value};`;
      }).join('\n');
      case 'block': this.scopes.push(new Map()); { const code = '{\n' + node.statements.map(statement => this.statement(statement)).join('\n') + '\n}'; this.scopes.pop(); return code; }
      case 'expression': return expression(node.value) + ';';
      case 'if': return `if (${expression(node.condition)}) ${this.statement(node.yes)}${node.no ? ' else ' + this.statement(node.no) : ''}`;
      case 'while': return `while (${expression(node.condition)}) { await __runtime.checkInterrupt(); ${this.statement(node.body)} }`;
      case 'do': return `do { await __runtime.checkInterrupt(); ${this.statement(node.body)} } while (${expression(node.condition)});`;
      case 'for': {
        this.scopes.push(new Map());
        const init = node.init?.kind === 'declaration' ? this.statement(node.init).replace(/;\n(?:let|const) /g, ', ').replace(/;$/, '') : node.init ? expression(node.init) : '';
        const code = `for (${init}; ${node.condition ? expression(node.condition) : 'true'}; ${node.update ? expression(node.update) : ''}) { await __runtime.checkInterrupt(); ${this.statement(node.body)} }`;
        this.scopes.pop(); return code;
      }
      case 'switch': return `switch (${expression(node.value)}) { ${node.cases.map(item => (item.value ? 'case ' + expression(item.value) : 'default') + ':\n' + item.statements.map(statement => this.statement(statement)).join('\n')).join('\n')} }`;
      case 'break': return 'break;';
      case 'return': return 'return' + (node.value ? ' ' + this.cast(expression(node.value), this.currentFunction.type, this.currentFunction.dimensions.length) : '') + ';';
      default: throw new Error('Instrução não implementada: ' + node.kind);
    }
  }
  generate() {
    const globals = this.program.globals.map(node => this.statement(node, true)).join('\n');
    const functions = this.program.functions.map(fn => {
      this.currentFunction = fn; this.scopes.push(new Map()); for (const parameter of fn.parameters) this.declare(parameter);
      const body = this.statement(fn.body); this.scopes.pop();
      return `async function __fn_${fn.name}(${fn.parameters.map(p => '__v_' + p.name).join(',')}) { __runtime.enterFunction(); try { await __runtime.checkInterrupt(); ${body} } finally { __runtime.leaveFunction(); } }`;
    }).join('\n');
    return `return (async () => {\n${globals}\n${functions}\n${this.functions.has('inicio') ? 'await __fn_inicio();' : ''}\n})();`;
  }
}

export function compile(tokens) { return new Generator(new Parser(tokens).program()).generate(); }
export function parseProgram(tokens) { return new Parser(tokens).program(); }
