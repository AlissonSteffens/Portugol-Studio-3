export const valueMethods = {
  defaultValue(type) { return { cadeia: '', caracter: '\0', logico: false, inteiro: 0, real: 0 }[type]; },
  cast(value, type) {
    if (type === 'inteiro') return Math.trunc(Number(value));
    if (type === 'real') return Number(value);
    if (type === 'cadeia') return this.stringify(value);
    if (type === 'caracter') return String(value).charAt(0) || '\0';
    if (type === 'logico') return !!value;
    return value;
  },
  stringify(value) { return typeof value === 'boolean' ? value ? 'verdadeiro' : 'falso' : String(value ?? ''); },
  divide(left, right, integer, remainder) {
    if (right === 0) throw new Error('Não é possível dividir por zero.');
    const result = remainder ? left % right : left / right;
    return integer ? Math.trunc(result) : result;
  },
  reference(get, set) { return { get value() { return get(); }, set value(value) { set(value); } }; },
  enterFunction() {
    this.__depth = (this.__depth || 0) + 1;
    if (this.__depth > (this.options.maxCallDepth || 256)) throw new Error('Limite de chamadas recursivas excedido.');
  },
  leaveFunction() { this.__depth--; },
  async checkInterrupt() {
    if (this.__aborted) throw new Error('EXECUCAO_INTERROMPIDA');
    this.__steps = (this.__steps || 0) + 1;
    if (this.__steps > (this.options.stepLimit || Infinity)) throw new Error('Limite de instruções excedido.');
    if (performance.now() - (this.__lastYield || this.__startTime) > 12) {
      await new Promise(resolve => setTimeout(resolve, 0)); this.__lastYield = performance.now();
      if (this.__aborted) throw new Error('EXECUCAO_INTERROMPIDA');
    }
  },
  checkedArray(values, type, dimensions) {
    if (values.length > (this.options.maxArrayElements || 2_000_000)) throw new Error('Limite de memória dos vetores excedido.');
    const runtime = this;
    function index(property) {
      if (typeof property !== 'string' || !/^-?\d+(\.\d+)?$/.test(property)) return;
      const value = Number(property);
      if (!Number.isInteger(value) || value < 0 || value >= values.length) throw new Error('Índice fora dos limites do vetor: ' + property);
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
    if (dimensions.reduce((size, length) => size * length, 1) > (this.options.maxArrayElements || 2_000_000)) throw new Error('Limite de memória dos vetores excedido.');
    if (!Number.isInteger(length) || length < 0 || length > (this.options.maxArrayElements || 2_000_000)) throw new Error('Tamanho de vetor inválido ou limite de memória excedido.');
    const values = Array.from({ length }, () => dimensions.length > 1 ? this.array(dimensions.slice(1), type) : this.defaultValue(type));
    return this.checkedArray(values, type, dimensions.length);
  },
  arrayFrom(values, type, dimensions) {
    return this.checkedArray(values.map(value => dimensions > 1 ? this.arrayFrom(value, type, dimensions - 1) : this.cast(value, type)), type, dimensions);
  },
};
