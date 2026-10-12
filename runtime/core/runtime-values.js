import { validateLibraryCall } from './library-validation.js';
import { runtimeError } from './diagnostics.js';

export const valueMethods = {
  readValue(value, name, from, to) {
    if (value === undefined) throw Object.assign(runtimeError('ErroVariavelNaoInicializada', `A variável “${name}” não foi inicializada. Atribua um valor ou utilize leia(${name}) antes de usá-la.`), { from, to });
    return value;
  },
  element(array, index, matrix, from, to) {
    const error = message => Object.assign(runtimeError(matrix ? 'ErroIndiceMatrizInvalido' : 'ErroIndiceVetorInvalido', message), { from, to });
    if (!Array.isArray(array) || !Number.isInteger(index) || index < 0 || index >= array.length) throw error(`O índice [${index}] é inválido para ${matrix ? 'a matriz' : 'o vetor'}. Os índices começam em 0 e devem ser menores que ${array?.length ?? 0}.`);
    return this.reference(() => {
      const value = array[index];
      if (value === undefined) throw Object.assign(runtimeError('ErroValorVetorMatrizNaoInicializado', `O elemento na posição [${index}] não foi inicializado. Atribua um valor antes de utilizá-lo.`), { from, to });
      return value;
    }, value => { array[index] = value; });
  },
  increment(reference, amount, postfix) {
    const before = this.readValue(reference.value, 'incrementada');
    reference.value = before + amount;
    return postfix ? before : reference.value;
  },
  async setObjectProperty(args, type, from, to) {
    await this.callLibrary('Objetos', 'atribuir_propriedade', args, from, to);
    this.tagObjectProperty(args[0], args[1], type);
  },
  async callLibrary(library, name, args, from, to) {
    try { validateLibraryCall(library, name, args); return await this[library][name](...args); }
    catch (error) {
      if (error.message === 'EXECUCAO_INTERROMPIDA') throw error;
      error.code ??= 'ErroExecucao.ErroExecucaoBiblioteca';
      error.from ??= from; error.to ??= to;
      if (error instanceof TypeError || error instanceof RangeError) error = Object.assign(runtimeError('ErroExecucaoBiblioteca', `Não foi possível executar ${library}.${name}. Verifique os parâmetros e recursos informados.`), { from, to, cause: error });
      throw error;
    }
  },
  translateError(error) {
    if (error.message === 'EXECUCAO_INTERROMPIDA') return error;
    if (!error.code) {
      if (error instanceof RangeError && /stack|recurs/i.test(error.message)) error = Object.assign(runtimeError('ErroEstouroPilha', 'Ocorreu um estouro de pilha. Verifique se as chamadas recursivas possuem uma condição de parada.'), { cause: error });
      else if (error instanceof RangeError) error = Object.assign(runtimeError('ErroMemoriaInsuficiente', 'O programa excedeu a memória disponível. Reduza o tamanho dos vetores, matrizes ou recursos utilizados.'), { cause: error });
      else if (error instanceof TypeError || error instanceof ReferenceError) error = Object.assign(runtimeError('ErroExecucaoNaoTratado', 'Não foi possível executar este comando. Verifique os valores e recursos utilizados nesta linha.'), { cause: error });
      else error.code = 'ErroExecucao.ErroExecucaoNaoTratado';
    }
    error.from ??= this.sourcePosition ?? 0;
    error.to ??= this.sourceEnd ?? error.from + 1;
    return error;
  },
  defaultValue(type) { return { cadeia: '', caracter: '\0', logico: false, inteiro: 0, real: 0 }[type]; },
  cast(value, type) {
    if (['inteiro', 'real'].includes(type)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) throw runtimeError('ErroImpossivelConverterTipos', `Não é possível converter o valor informado para ${type}. Utilize uma função da biblioteca Tipos para converter textos.`);
      return type === 'inteiro' ? Math.max(-2147483648, Math.min(2147483647, Math.trunc(value))) : value;
    }
    if (type === 'cadeia') return this.stringify(value);
    if (type === 'caracter') return String(value).charAt(0) || '\0';
    if (type === 'logico') return !!value;
    return value;
  },
  stringify(value) { return typeof value === 'boolean' ? value ? 'verdadeiro' : 'falso' : String(value ?? ''); },
  divide(left, right, integer, remainder, from, to) {
    if (right === 0) throw Object.assign(runtimeError('ErroDivisaoPorZero', 'Não é possível dividir por zero. Verifique o valor do divisor antes de efetuar a divisão.'), from === undefined ? {} : { from, to });
    const result = remainder ? left % right : left / right;
    return integer ? Math.trunc(result) : result;
  },
  reference(get, set) { return { get value() { return get(); }, set value(value) { set(value); } }; },
  enterFunction(name) {
    this.debugger?.enter(name);
    this.__depth = (this.__depth || 0) + 1;
    if (this.__depth > (this.options.maxCallDepth || 256)) { this.__depth--; throw runtimeError('ErroEstouroPilha', 'Limite de chamadas recursivas excedido. A função está chamando a si mesma sem uma condição de parada ou com profundidade excessiva.'); }
  },
  leaveFunction() { this.__depth--; this.debugger?.leave(); },
  async checkInterrupt() {
    if (this.__aborted) throw new Error('EXECUCAO_INTERROMPIDA');
    this.__steps = (this.__steps || 0) + 1;
    if (this.__steps > (this.options.stepLimit || Infinity)) throw new Error('Limite de instruções excedido.');
    if (performance.now() - (this.__lastYield || this.__startTime) > 12) {
      await this.waitForDelay(0); this.__lastYield = performance.now();
      if (this.__aborted) throw new Error('EXECUCAO_INTERROMPIDA');
    }
  },
  checkedArray(values, type, dimensions) {
    if (values.length > (this.options.maxArrayElements || 2_000_000)) throw runtimeError('ErroMemoriaInsuficiente', 'Limite de memória dos vetores excedido. Reduza o tamanho do vetor ou matriz.');
    const runtime = this;
    function index(property) {
      if (typeof property !== 'string' || !/^-?\d+(\.\d+)?$/.test(property)) return;
      const value = Number(property);
      if (!Number.isInteger(value) || value < 0 || value >= values.length) throw runtimeError('ErroIndiceInvalido', 'Índice fora dos limites do vetor: ' + property + '. Os índices começam em 0 e devem ser menores que ' + values.length + '.');
    }
    return new Proxy(values, {
      get(target, property, receiver) { index(property); return Reflect.get(target, property, receiver); },
      set(target, property, value, receiver) {
        index(property);
        return Reflect.set(target, property, dimensions > 1 ? value : runtime.cast(value, type), receiver);
      },
    });
  },
  array(dimensions, type) {
    const length = dimensions[0];
    if (dimensions.some(length => !Number.isInteger(length) || length < 0) || dimensions.reduce((size, length) => size * length, 1) > (this.options.maxArrayElements || 2_000_000)) throw runtimeError('ErroMemoriaInsuficiente', 'Tamanho de vetor inválido ou limite de memória excedido. Reduza o tamanho do vetor ou matriz.');
    const values = Array.from({ length }, () => dimensions.length > 1 ? this.array(dimensions.slice(1), type) : this.defaultValue(type));
    return this.checkedArray(values, type, dimensions.length);
  },
  arrayFrom(values, type, dimensions) {
    return this.checkedArray(values.map(value => dimensions > 1 ? this.arrayFrom(value, type, dimensions - 1) : this.cast(value, type)), type, dimensions);
  },
};
