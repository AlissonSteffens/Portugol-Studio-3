import { isSynchronousLibraryCall, synchronousFunctions } from './execution-policy.js';
import { librarySignature } from '../../libraries/contracts/signatures.js';
import { libraryConstants } from '../../libraries/contracts/index.js';
import { PRECEDENCE } from '../syntax/operators.js';
const literal = value => JSON.stringify(value);

export class Generator {
  constructor(program, options = {}) {
    this.inspect = options.inspect; this.debug = options.debug;
    this.syncFunctions = synchronousFunctions(program);
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
    if (value.type === type && value.dimensions === dimensions && ['name', 'index'].includes(node.kind)) return value.code;
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
      if (!write && node.kind === 'index') value.code = value.code.replace('__runtime.element(', '__runtime.readElement(').slice(0, -6);
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
          const invocation = args.join(',');
          if (this.syncFunctions.has(name)) return result(this.synchronous || !this.debug ? `__fn_fast_${name}(${invocation})` : `(__runtime.debugger?.needsInstrumentation() ? (await __fn_${name}(${invocation})) : __fn_fast_${name}(${invocation}))`, fn.type, fn.dimensions.length);
          return result(`(await __fn_${name}(${invocation}))`, fn.type, fn.dimensions.length);
        }
        const member = node.target, library = this.libraries[member.object?.name];
        const contract = librarySignature(library, member.name);
        if (!contract) throw new Error('Método de biblioteca desconhecido: ' + library + '.' + member.name);
        const args = node.args.map((arg, i) => { const value = this.expression(arg), parameter = contract.parameters[i]; return parameter ? this.convert(arg, parameter.type, parameter.dimensions) : value.code; });
        const call = `(${isSynchronousLibraryCall(library, member.name) ? '__runtime.callLibrarySync' : 'await __runtime.callLibrary'}(${literal(library)}, ${literal(member.name)}, [${args.join(',')}], ${node.from || 0}, ${node.to || 0}))`;
        if (library === 'Objetos' && member.name === 'atribuir_propriedade' && node.args.length === 3) {
          const type = this.expression(node.args[2]).type;
          return result(`(__runtime.setObjectProperty([${args.join(',')}], ${literal(type)}, ${node.from || 0}, ${node.to || 0}))`, contract.type);
        }
        return result(call, contract.type);
      }
      case 'unary': case 'postfix': {
        const op = node.op === 'nao' ? '!' : node.op, value = this.expression(node.value, ['++', '--'].includes(op));
        if (['++', '--'].includes(op) && (!value.assignable || value.constant)) throw new Error('Incremento exige uma variável modificável.');
        if (['++', '--'].includes(op) && node.value.kind === 'name' && !this.lookup(node.value.name).ref) {
          const before = this.expression(node.value).code;
          return result(`((__before) => (${value.code} = ${this.cast(`__before ${op === '++' ? '+' : '-'} 1`, value.type)}, ${node.kind === 'postfix' ? '__before' : value.code}))(${before})`, value.type);
        }
        if (['++', '--'].includes(op)) return result(`__runtime.increment(${this.ref(node.value)}, ${op === '++' ? 1 : -1}, ${node.kind === 'postfix'})`, value.type);
        return result(node.kind === 'postfix' ? `(${value.code}${op})` : `(${op}${value.code})`, op === '!' ? 'logico' : value.type);
      }
      case 'binary': {
        const op = node.op, left = this.expression(node.left, PRECEDENCE[op] === 1), right = this.expression(node.right);
        if (PRECEDENCE[op] === 1) {
          if (!left.assignable || left.constant) throw new Error('Atribuição exige uma variável modificável.');
          if (node.left.kind === 'name' && !this.lookup(node.left.name).ref) {
            if (op === '=') return result(`(${left.code} = ${this.cast(right.code, left.type, left.dimensions)})`, left.type, left.dimensions);
            const combined = this.operation(op[0], this.expression(node.left), { ...right, code: '__right' }, node);
            return result(`((__right) => (${left.code} = ${this.cast(combined.code, left.type, left.dimensions)}))(${right.code})`, left.type, left.dimensions);
          }
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
  snapshot(node, force = 'false') {
    const symbols = this.scopes.flatMap(scope => [...scope.values()]).filter(symbol => symbol.initialized !== false);
    return `if (__runtime.shouldInspect?.(${force}) ?? true) { __runtime.inspect?.(${JSON.stringify(this.currentFunction?.name || 'programa')}, ${node.from || 0}, [${symbols.map(symbol => `{name:${literal(symbol.name)},from:${symbol.from || 0},type:${literal(symbol.type)},value:(() => { try { return ${symbol.code}${symbol.ref ? '.value' : ''}; } catch { return undefined; } })()}`).join(',')}]); }`;
  }
  checkpoint(node) {
    return this.debug ? `if (__runtime.debugger?.shouldPause(${node.from || 0})) { ${this.snapshot(node, 'true')} await __runtime.debugger.checkpoint(${node.from || 0}, ${node.to || (node.from || 0) + 1}); }` : '';
  }
  interrupt() { return '{ const __interruption = __runtime.checkInterrupt(); if (__interruption) await __interruption; }'; }
  statement(node, globals = false) {
    try {
      const before = !['block', 'empty', 'while', 'for', 'do'].includes(node.kind) ? this.checkpoint(node) : '';
      const code = this.readStatement(node, globals);
      const location = before + `__runtime.sourcePosition = ${node.from || 0}; __runtime.sourceEnd = ${node.to || (node.from || 0) + 1};`;
      if (['block', 'empty'].includes(node.kind)) return code;
      if (!this.inspect) return node.kind === 'declaration' ? location + code : '{' + location + code + '}';
      if (['break', 'return'].includes(node.kind)) return '{' + location + this.snapshot(node, '__runtime.__depth <= 1') + code + '}';
      return node.kind === 'declaration' ? location + code + this.snapshot(node) : '{' + location + this.snapshot(node, node.value?.kind === 'call' && node.value.target?.name === 'leia' ? 'true' : 'false') + code + this.snapshot(node) + '}';
    } catch (error) { error.from ??= node.from; error.to ??= node.to; throw error; }
  }
  readStatement(node, globals = false) {
    const expression = value => this.expression(value).code;
    const condition = value => { const code = value ? expression(value) : 'true'; return this.debug ? `(__runtime.debugger?.shouldPause(${node.from || 0}) ? (await (async () => { ${this.checkpoint(node)} return ${code}; })()) : ${code})` : code; };
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
      case 'block': this.scopes.push(new Map()); { const code = '{\n' + node.statements.map(statement => this.statement(statement)).join('\n') + (this.inspect && node === this.currentFunction?.body ? this.snapshot(node, '__runtime.__depth <= 1') : '') + '\n}'; this.scopes.pop(); return code; }
      case 'expression': return expression(node.value) + ';';
      case 'if': return `if (${expression(node.condition)}) ${this.statement(node.yes)}${node.no ? ' else ' + this.statement(node.no) : ''}`;
      case 'while': return `while (${condition(node.condition)}) { ${this.interrupt()} ${this.statement(node.body)} }`;
      case 'do': return `do { ${this.interrupt()} ${this.statement(node.body)} } while (${condition(node.condition)});`;
      case 'for': {
        this.scopes.push(new Map());
        const init = node.init?.kind === 'declaration' ? this.readStatement(node.init).replace(/;\n(?:let|const) /g, ', ').replace(/;$/, '') : node.init ? expression(node.init) : '';
        const code = `for (${init}; ${condition(node.condition)}; ${node.update ? expression(node.update) : ''}) { ${this.interrupt()} ${this.statement(node.body)} }`;
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
    const debug = this.debug;
    const generateFunction = (fn, synchronous) => {
      this.currentFunction = fn; this.synchronous = synchronous; this.debug = debug && !synchronous;
      this.scopes.push(new Map()); for (const parameter of fn.parameters) this.declare(parameter);
      const entry = this.inspect ? this.snapshot(fn) : '';
      const body = this.statement(fn.body); this.scopes.pop();
      return `${synchronous ? '' : 'async '}function __fn_${synchronous ? 'fast_' : ''}${fn.name}(${fn.parameters.map(p => '__v_' + p.name).join(',')}) { __runtime.enterFunction(${literal(fn.name)}); try { ${synchronous ? '__runtime.checkInterrupt(false);' : this.interrupt()} ${entry}${body} } catch (__error) { throw __runtime.translateError(__error); } finally { __runtime.leaveFunction(); } }`;
    };
    const functions = this.program.functions.flatMap(fn => this.syncFunctions.has(fn.name) ? [generateFunction(fn, true), ...(debug ? [generateFunction(fn, false)] : [])] : [generateFunction(fn, false)]).join('\n');
    this.debug = debug; this.synchronous = false;
    return `return (async () => { try {\n${globals}\n${functions}\n${this.functions.has('inicio') ? (this.functions.get('inicio').parameters.length ? `await __fn_${this.syncFunctions.has('inicio') && !debug ? 'fast_' : ''}inicio(__runtime.options.arguments || []);` : `await __fn_${this.syncFunctions.has('inicio') && !debug ? 'fast_' : ''}inicio();`) : ''}\n} catch (__error) { throw __runtime.translateError(__error); } })();`;
  }
}

