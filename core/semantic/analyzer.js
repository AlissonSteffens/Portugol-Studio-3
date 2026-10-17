import { librarySignature } from '../../libraries/contracts/signatures.js';
import contracts, { libraryConstants } from '../../libraries/contracts/index.js';
import { compatibility, operatorTables } from './type-compatibility.js';
import { diagnostic } from '../diagnostics/index.js';

const unknown = () => ({ type: null, dimensions: 0 });
const assignmentOps = new Set(['=', '+=', '-=', '*=', '/=', '%=']);
const builtins = new Set(['leia', 'escreva', 'limpa', 'sorteia']);
const literalConstant = node => node?.kind === 'literal' || (node?.kind === 'unary' && node.op === '-' && node.value?.kind === 'literal');
const rankName = rank => ['uma variável', 'um vetor', 'uma matriz'][rank] || 'um vetor ou matriz';

class SemanticAnalyzer {
  constructor(program) {
    this.program = program; this.diagnostics = []; this.scopes = [new Map()];
    this.functions = new Map(); this.libraries = new Map(); this.fn = null; this.loopDepth = 0; this.switchDepth = 0;
  }
  add(id, node, message, severity = 'error') {
    this.diagnostics.push(diagnostic(`${severity === 'warning' ? 'Aviso' : 'ErroSemantico'}.${id}`, node, message, severity));
  }
  lookup(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) if (this.scopes[i].has(name)) return this.scopes[i].get(name);
  }
  declare(item, parameter = false) {
    const scope = this.scopes.at(-1), existing = scope.get(item.name);
    if (existing || builtins.has(item.name) || (this.scopes.length === 1 && this.functions.has(item.name))) {
      this.add(parameter ? 'ErroParametroRedeclarado' : 'ErroSimboloRedeclarado', item, `O ${parameter ? 'parâmetro' : 'símbolo'} “${item.name}” já foi declarado${existing?.line ? ` na linha ${existing.line}` : ' neste escopo'}.`);
    } else if (this.scopes.length > 1 && (this.scopes[0].has(item.name) || this.functions.has(item.name))) {
      this.add('AvisoSimboloGlobalOcultado', item, `O símbolo “${item.name}” está ocultando um símbolo do escopo global.`, 'warning');
    }
    const symbol = { ...item, dimensions: item.dimensions.length, assignable: true, initialized: parameter || !!item.value || (this.scopes.length === 1 && !item.constant), parameter, global: this.scopes.length === 1 };
    scope.set(item.name, symbol); return symbol;
  }
  convert(value, type, dimensions, node, context = 'Atribuicao', ref = false) {
    if (!value.type) return;
    if (dimensions !== value.dimensions) {
      this.add(context === 'ChamadaFuncao' ? 'ErroQuantificadorParametroFuncao' : 'ErroAtribuirMatrizVetorEmVariavel', node, `Era esperada ${rankName(dimensions)}, mas foi passada ${rankName(value.dimensions)}.`); return;
    }
    const result = compatibility[context]?.[`${type}:${value.type}`];
    if (!result || result === 'tipos_incompativeis' || (ref && type !== value.type)) {
      this.add(context === 'ChamadaFuncao' ? 'ErroTipoParametroIncompativel' : 'ErroTiposIncompativeis', node, `Tipos incompatíveis! Era esperado um valor do tipo “${type}”, mas foi informado “${value.type}”.`);
    } else if (result === 'ocorre_conversao') {
      this.add('AvisoValorExpressaoSeraConvertido', node, type === 'inteiro' ? 'Conversão de real para inteiro: a parte decimal será descartada. Use uma variável real para preservar as casas decimais.' : `O valor do tipo “${value.type}” será convertido para “${type}”.`, 'warning');
    }
  }
  constant(node) {
    if (!node) return;
    if (node.kind === 'literal') {
      if (node.token.type === 'number') return Number(node.token.value);
      if (node.token.value === 'verdadeiro') return true;
      if (node.token.value === 'falso') return false;
    }
    if (node.kind === 'name') return this.lookup(node.name)?.constantValue;
    if (node.kind === 'unary') {
      const value = this.constant(node.value);
      if (value !== undefined) return node.op === '-' ? -value : node.op === '+' ? +value : ['!', 'nao'].includes(node.op) ? !value : ~value;
    }
    if (node.kind === 'binary' && !assignmentOps.has(node.op)) {
      const a = this.constant(node.left), b = this.constant(node.right);
      if (a === undefined || b === undefined) return;
      switch (node.op) {
        case '+': return a + b; case '-': return a - b; case '*': return a * b;
        case '/': return b === 0 ? undefined : Math.trunc(a / b); case '%': return b === 0 ? undefined : a % b;
        case '<<': return a << b; case '>>': return a >> b; case '&': return a & b; case '|': return a | b; case '^': return a ^ b;
        case '==': return a === b; case '!=': return a !== b; case '<': return a < b; case '>': return a > b;
        case '<=': return a <= b; case '>=': return a >= b; case 'e': return a && b; case 'ou': return a || b;
      }
    }
  }
  arrayLiteral(node, rank) {
    if (!node.items.length) this.add(rank > 1 ? 'ErroInicializacaoMatrizEmBranco' : 'ErroVetorSemElementos', node, `A inicialização ${rank > 1 ? 'da matriz' : 'do vetor'} não possui elementos.`);
    const start = this.diagnostics.length;
    const values = node.items.map(item => this.expression(item));
    if (rank > 1) for (const item of this.diagnostics.slice(start)) {
      if (item.code === 'ErroSemantico.ErroDefinirTipoDadoVetorLiteral') item.code = 'ErroSemantico.ErroDefinirTipoDadoMatrizLiteral';
      if (item.code === 'ErroSemantico.ErroVetorSemElementos') item.code = 'ErroSemantico.ErroInicializacaoMatrizEmBranco';
    }
    const first = values.find(value => value.type) || unknown();
    if (values.some(value => value.type && (value.type !== first.type || value.dimensions !== first.dimensions))) this.add(rank > 1 || first.dimensions ? 'ErroDefinirTipoDadoMatrizLiteral' : 'ErroDefinirTipoDadoVetorLiteral', node, 'A inicialização do vetor ou matriz possui mais de um tipo de dado ou dimensão.');
    if (first.dimensions && node.items.some(item => item.kind !== 'array' || item.items.length !== node.items[0].items?.length)) this.add('ErroQuantidadeElementosColunaInicializacaoMatriz', node, 'Todas as linhas da matriz devem possuir a mesma quantidade de elementos.');
    return { type: first.type, dimensions: first.dimensions + 1 };
  }
  library(node) {
    const alias = node.object?.name;
    if (node.object?.kind !== 'name' || !this.libraries.has(alias)) {
      this.add(contracts[alias] ? 'ErroBibliotecaNaoInserida' : 'ErroAliasInexistente', node, contracts[alias] ? `A biblioteca “${alias}” não foi incluída no programa.` : `“${alias || ''}” não é um alias de biblioteca. Inclua uma biblioteca com: inclua biblioteca Graficos --> ${alias || 'g'}.`);
      return;
    }
    return this.libraries.get(alias);
  }
  expression(node, mode = 'read') {
    if (!node) return unknown();
    switch (node.kind) {
      case 'literal': return { type: node.token.type === 'number' ? (node.token.value.includes('.') ? 'real' : 'inteiro') : node.token.type === 'string' ? 'cadeia' : node.token.type === 'char' ? 'caracter' : 'logico', dimensions: 0 };
      case 'name': {
        const symbol = this.lookup(node.name);
        if (!symbol) {
          this.add(this.libraries.has(node.name) && mode === 'write' ? 'ErroAtribuirFuncaoBiblioteca' : this.functions.has(node.name) || this.libraries.has(node.name) ? 'ErroReferenciaInvalida' : 'ErroSimboloNaoDeclarado', node, this.functions.has(node.name) ? `A função “${node.name}” está sendo utilizada como uma variável. Utilize ${node.name}().` : this.libraries.has(node.name) ? `“${node.name}” é uma biblioteca e não pode receber ou fornecer valores diretamente.` : `Símbolo não declarado: ${node.name}. Declare-o antes de utilizá-lo.`);
          return unknown();
        }
        if (mode === 'read' && !symbol.initialized && !symbol.dimensions) this.add(symbol.maybeInitialized ? 'ErroVariavelPodeNaoTerSidoInicializada' : 'ErroSimboloNaoInicializado', node, `A variável “${node.name}” ${symbol.maybeInitialized ? 'pode não ter sido' : 'não foi'} inicializada. Atribua um valor ou utilize leia(${node.name}) antes de usá-la.`);
        return symbol;
      }
      case 'array': return this.arrayLiteral(node, node.items.some(item => item.kind === 'array') ? 2 : 1);
      case 'index': {
        const object = this.expression(node.object, mode), index = this.expression(node.index);
        if (object.type && !object.dimensions) this.add('ErroReferenciaInvalida', node, 'Uma variável escalar não pode ser utilizada como vetor ou matriz.');
        if (index.type && (index.type !== 'inteiro' || index.dimensions)) this.add('ErroTiposIncompativeis', node.index, 'O índice de um vetor ou matriz deve ser uma expressão do tipo inteiro.');
        return { ...object, dimensions: Math.max(0, object.dimensions - 1), indexed: true };
      }
      case 'member': {
        const library = this.library(node);
        if (!library) return unknown();
        const constant = libraryConstants[library]?.[node.name];
        if (!constant) {
          this.add(contracts[library]?.[node.name] ? 'ErroReferenciaInvalida' : 'ErroConstanteNaoEncontradaNaBiblioteca', node, `A constante “${node.name}” não existe na biblioteca “${library}”.`); return unknown();
        }
        return { type: constant.type, dimensions: 0, constant: true, libraryConstant: true };
      }
      case 'call': return this.call(node);
      case 'unary': case 'postfix': {
        const modifying = ['++', '--'].includes(node.op), value = this.expression(node.value, modifying ? 'readwrite' : 'read');
        if (modifying) this.writable(node.value, value);
        const expected = ['nao', '!'].includes(node.op) ? ['logico'] : node.op === '~' ? ['inteiro'] : ['inteiro', 'real'];
        if (value.type && (!expected.includes(value.type) || value.dimensions)) this.add('ErroTiposIncompativeis', node, `A operação “${node.op}” espera ${expected.join(' ou ')}, mas recebeu “${value.type}”.`);
        if (modifying && !value.initialized && !value.indexed) this.add('ErroSimboloNaoInicializado', node.value, 'Inicialize a variável antes de incrementá-la ou decrementá-la.');
        return { type: expected[0] === 'logico' ? 'logico' : value.type, dimensions: 0 };
      }
      case 'binary': {
        const assignment = assignmentOps.has(node.op);
        const left = this.expression(node.left, assignment ? node.op === '=' ? 'write' : 'read' : 'read'), right = this.expression(node.right);
        if (assignment) {
          this.writable(node.left, left);
          const value = node.op === '=' ? right : this.operation(node.op[0], left, right, node);
          this.convert(value, left.type, left.dimensions, node.right);
          if (node.left.kind === 'name' && left.assignable && !left.constant) { left.initialized = true; left.maybeInitialized = false; }
          return { type: left.type, dimensions: left.dimensions };
        }
        return this.operation(node.op, left, right, node);
      }
      default: return unknown();
    }
  }
  writable(node, value, reference = false) {
    if (value.constant) this.add(value.libraryConstant ? 'ErroAtribuirConstanteBiblioteca' : 'ErroAtribuirEmConstante', node, 'Uma constante não pode ter seu valor alterado após a inicialização.');
    else if (!value.assignable && value.type) this.add(node.kind === 'call' ? 'ErroAtribuirEmChamadaFuncao' : 'ErroAtribuirEmExpressao', node, 'Você só pode atribuir valores a variáveis ou posições de vetores e matrizes. Para comparar igualdade, utilize == em vez de =.');
    else if (value.dimensions && !reference) this.add(value.dimensions === 1 ? 'ErroAoAtribuirEmVetor' : 'ErroAoAtribuirEmMatriz', node, 'Deve-se atribuir um valor a uma posição do vetor ou matriz, utilizando índices entre colchetes.');
  }
  operation(op, left, right, node) {
    if (!left.type || !right.type) return unknown();
    const result = compatibility[operatorTables[op]]?.[`${left.type}:${right.type}`];
    if (!result || result === 'tipos_incompativeis' || left.dimensions || right.dimensions) {
      this.add('ErroTiposIncompativeis', node, `Tipos incompatíveis! A operação “${op}” não aceita “${left.type}” e “${right.type}”.`); return unknown();
    }
    return { type: result, dimensions: 0 };
  }
  call(node) {
    const name = node.target.name;
    if (node.target.kind === 'name' && name === 'sorteia') {
      if (node.args.length !== 2) this.add('ErroNumeroParametrosFuncao', node, 'A função sorteia espera dois parâmetros inteiros.');
      node.args.forEach(arg => { const value = this.expression(arg); if (value.type && (value.type !== 'inteiro' || value.dimensions)) this.add('ErroTipoParametroIncompativel', arg, 'Os parâmetros da função sorteia devem ser do tipo inteiro.'); });
      return { type: 'inteiro', dimensions: 0 };
    }
    if (node.target.kind === 'name' && builtins.has(name)) {
      if ((name === 'limpa' && node.args.length) || (name !== 'limpa' && !node.args.length)) this.add('ErroNumeroParametrosFuncao', node, `A função “${name}” ${name === 'limpa' ? 'não espera parâmetros' : 'espera ao menos um parâmetro'}.`);
      for (const arg of node.args) {
        const value = this.expression(arg, name === 'leia' ? 'write' : 'read');
        if (name === 'leia') {
          if (!value.assignable || value.constant || value.dimensions) this.add('ErroLeiaNecessitaReferencia', arg, 'O parâmetro da função leia deve ser uma referência a uma variável ou a uma posição de vetor ou matriz modificável.');
          else if (arg.kind === 'name') { value.initialized = true; value.maybeInitialized = false; }
        } else if (value.type === 'vazio' || value.dimensions) this.add('ErroTipoParametroIncompativel', arg, 'Você não pode passar uma função sem retorno, vetor ou matriz diretamente para escreva.');
      }
      return { type: 'vazio', dimensions: 0 };
    }
    let fn;
    if (node.target.kind === 'name') {
      fn = this.lookup(name) ? undefined : this.functions.get(name);
      if (!fn) this.add(this.lookup(name) ? 'ErroReferenciaInvalida' : 'ErroSimboloNaoDeclarado', node.target, this.lookup(name) ? `A variável “${name}” não pode ser chamada como função.` : `A função “${name}” não foi declarada no programa.`);
    } else if (node.target.kind === 'member') {
      const library = this.library(node.target);
      fn = librarySignature(library, name);
      if (library && (!fn || !fn.available)) this.add('ErroSimboloNaoDeclarado', node.target, `A função “${name}” não existe ou não está disponível na biblioteca “${library}”.`);
    } else this.add('ErroReferenciaInvalida', node.target, 'Esta expressão não pode ser chamada como função.');
    const values = node.args.map((arg, i) => this.expression(arg, fn?.parameters[i]?.ref ? 'write' : 'read'));
    if (!fn) return unknown();
    if (node.args.length < (fn.minimum ?? fn.parameters.length) || node.args.length > fn.parameters.length) {
      this.add('ErroNumeroParametrosFuncao', node, `A função “${name}” espera ${fn.parameters.length} parâmetro(s), mas foram passados ${node.args.length}.`);
      node.args.slice(fn.parameters.length).forEach(arg => this.add('ErroParametroExcedente', arg, `A expressão está sobrando na chamada da função “${name}”.`));
    }
    values.forEach((value, i) => {
      const parameter = fn.parameters[i]; if (!parameter) return;
      const dimensions = Array.isArray(parameter.dimensions) ? parameter.dimensions.length : parameter.dimensions;
      this.convert(value, parameter.type, dimensions, node.args[i], 'ChamadaFuncao', parameter.ref || (dimensions > 0 && parameter.type !== 'todos'));
      if (parameter.ref && node.args[i].kind === 'name') { value.initialized = true; value.maybeInitialized = false; }
      if ((parameter.ref || (dimensions > 0 && parameter.type !== 'todos')) && (!value.assignable || value.constant)) this.add('ErroPassagemParametroInvalida', node.args[i], `O parâmetro “${parameter.name}” da função “${name}” espera uma referência modificável; não passe um literal, constante ou expressão.`);
    });
    return { type: fn.type, dimensions: fn.dimensions?.length || 0 };
  }
  declaration(node) {
    for (const item of node.items) {
      const symbol = this.declare(item), rank = item.dimensions.length;
      if (item.type === 'vazio') this.add('ErroTiposIncompativeis', item, 'Variáveis e parâmetros não podem ter o tipo vazio.');
      if (rank > 2) this.add('ErroReferenciaInvalida', item, 'Portugol permite vetores e matrizes com até duas dimensões.');
      if (item.constant && !item.value) this.add('ErroSimboloNaoInicializado', item, `A constante “${item.name}” deve ser inicializada na declaração.`);
      const sizes = item.dimensions.map(dimension => {
        if (!dimension) return;
        const value = this.expression(dimension), size = this.constant(dimension);
        if (value.type && (value.type !== 'inteiro' || value.dimensions || !Number.isInteger(size))) this.add('ErroExpressaoTamanhoVetorMatriz', dimension, `O tamanho de “${item.name}” deve ser um valor ou expressão constante do tipo inteiro e positivo.`);
        else if (size <= 0) this.add('ErroTamanhoVetorMatriz', dimension, `O tamanho de “${item.name}” deve ser maior que zero.`);
        return size;
      });
      if (sizes.every(size => Number.isInteger(size)) && sizes.reduce((a, b) => a * b, 1) > 16777216) this.add(rank > 1 ? 'ErroTamanhoMaximoMatriz' : 'ErroTamanhoMaximoVetor', item, `“${item.name}” excede o limite de 16777216 posições do Portugol Studio.`);
      if (rank === 1 && sizes[0] === 1) this.add('AvisoVetorPodeSerVariavel', item, `O vetor ${item.name} tem tamanho [1] e pode ser substituído por uma variável.`, 'warning');
      if (rank === 2 && sizes[0] === 1 && sizes[1] === 1) this.add('AvisoMatrizPodeSerVariavel', item, `A matriz ${item.name} tem tamanho [1][1] e pode ser substituída por uma variável.`, 'warning');
      else if (rank === 2 && sizes.includes(1)) this.add('AvisoMatrizPodeSerVetor', item, `A matriz ${item.name} tem uma dimensão de tamanho 1 e pode ser substituída por um vetor.`, 'warning');
      if (!item.value) {
        if (item.dimensions.some(d => !d)) this.add('ErroExpressaoTamanhoVetorMatriz', item, 'Informe o tamanho do vetor ou matriz ou inicialize-o com valores literais.');
        continue;
      }
      if (rank && item.value.kind !== 'array') this.add(rank > 1 ? 'ErroAoInicializarMatriz' : 'ErroAoInicializarVetor', item.value, `“${item.name}” deve ser inicializado com ${rank > 1 ? 'uma matriz' : 'um vetor'} literal, por exemplo {${rank > 1 ? '{1, 2}, {3, 4}' : '1, 2, 3'}}.`);
      if (!rank && item.value.kind === 'array') this.add('ErroInicializacaoInvalida', item.value, 'Não é possível inicializar uma variável escalar com um vetor ou matriz.');
      const value = this.expression(item.value);
      this.convert(value, item.type, rank, item.value);
      if (rank && item.value.kind === 'array') {
        if (Number.isInteger(sizes[0]) && sizes[0] !== item.value.items.length) this.add(rank > 1 ? 'ErroQuantidadeLinhasIncializacaoMatriz' : 'ErroQuantidadeElementosInicializacaoVetor', item.value, `A inicialização de “${item.name}” deve possuir ${sizes[0]} ${rank > 1 ? 'linha(s)' : 'elemento(s)'}, mas possui ${item.value.items.length}.`);
        if (rank === 2) item.value.items.forEach(row => { if (row.kind === 'array' && Number.isInteger(sizes[1]) && row.items.length !== sizes[1]) this.add('ErroQuantidadeElementosColunaInicializacaoMatriz', row, `Cada linha da matriz “${item.name}” deve possuir ${sizes[1]} elementos.`); });
      }
      if (item.constant) {
        const checkLiteral = value => {
          if (value.kind === 'array') value.items.forEach(checkLiteral);
          else if (!literalConstant(value)) this.add('ErroInicializacaoConstante', value, `A constante “${item.name}” deve ser inicializada com um valor literal em vez de uma expressão.`);
        };
        checkLiteral(item.value);
        symbol.constantValue = this.constant(item.value);
      }
      symbol.initialized = true;
    }
  }
  initializationState() { return new Map(this.scopes.flatMap(scope => [...scope.values()].map(s => [s, { initialized: s.initialized, maybeInitialized: s.maybeInitialized }]))); }
  restore(state) { state.forEach((value, symbol) => Object.assign(symbol, value)); }
  condition(node, command) {
    const value = this.expression(node);
    if (value.type && (value.type !== 'logico' || value.dimensions)) this.add('ErroTiposIncompativeis', node, `O comando “${command}” espera uma expressão do tipo lógico, mas foi informado “${value.type}”.`);
  }
  list(statements, newScope = true) {
    if (newScope) this.scopes.push(new Map());
    let ends = false;
    for (const node of statements) {
      if (ends && node.kind !== 'empty') this.add('ErroCodigoNaoAlcancavel', node, 'Este trecho de código não é alcançável. Remova comandos após retorne, pare ou um laço infinito.');
      const exit = this.statement(node); ends ||= exit;
    }
    if (newScope) this.scopes.pop();
    return ends;
  }
  statement(node) {
    if (!node) return false;
    switch (node.kind) {
      case 'block': return this.list(node.statements);
      case 'declaration': this.declaration(node); break;
      case 'expression': {
        const value = this.expression(node.value);
        if (value.type && !['call', 'postfix'].includes(node.value.kind) && !(node.value.kind === 'unary' && ['++', '--'].includes(node.value.op)) && !(node.value.kind === 'binary' && assignmentOps.has(node.value.op))) this.add('ErroBlocoInvalido', node, 'Esta expressão não faz sentido sozinha no código. Atribua-a a uma variável ou utilize-a como condição. Para atribuir, use = em vez de ==.');
        break;
      }
      case 'if': {
        this.condition(node.condition, 'se');
        const before = this.initializationState(), yes = this.statement(node.yes), yesState = this.initializationState();
        this.restore(before); const no = this.statement(node.no), noState = this.initializationState();
        before.forEach((state, symbol) => {
          const a = yesState.get(symbol) || state, b = noState.get(symbol) || state;
          symbol.initialized = yes && !no ? b.initialized : no && !yes ? a.initialized : a.initialized && b.initialized;
          symbol.maybeInitialized = !symbol.initialized && (a.initialized || b.initialized || a.maybeInitialized || b.maybeInitialized);
        });
        return !!node.no && yes && no;
      }
      case 'while': case 'do': case 'for': {
        this.scopes.push(new Map());
        if (node.kind === 'for') {
          if (node.init?.kind === 'declaration') this.declaration(node.init);
          else if (node.init) { this.expression(node.init); if (!(node.init.kind === 'name' || (node.init.kind === 'binary' && assignmentOps.has(node.init.op)))) this.add('ErroInicializacaoErrada', node.init, 'Inicialize o comando para com uma declaração ou atribuição, por exemplo inteiro i = 0.'); }
          if (!node.condition) this.add('ErroParaSemExpressaoComparacao', node, 'O comando para necessita de uma condição de parada: para (; condicao;).');
          if (node.update && !(node.update.kind === 'postfix' || (node.update.kind === 'unary' && ['++', '--'].includes(node.update.op)) || (node.update.kind === 'binary' && assignmentOps.has(node.update.op)))) this.add('ErroParaSemExpressaoAtribuicao', node.update, 'O incremento do comando para deve ser uma atribuição, como i = i + 1, i++ ou i += 1.');
        }
        const before = this.initializationState();
        if (node.kind !== 'do') this.condition(node.condition, node.kind === 'for' ? 'para' : 'enquanto');
        this.loopDepth++; this.statement(node.body); this.loopDepth--;
        if (node.update) this.expression(node.update);
        if (node.kind === 'do') this.condition(node.condition, 'faca enquanto');
        else { const after = this.initializationState(); this.restore(before); before.forEach((state, symbol) => { symbol.maybeInitialized ||= !state.initialized && after.get(symbol)?.initialized; }); }
        this.scopes.pop();
        return this.constant(node.condition) === true && !this.hasEscapingBreak(node.body);
      }
      case 'switch': {
        const choice = this.expression(node.value);
        if (choice.type && (!['inteiro', 'caracter'].includes(choice.type) || choice.dimensions)) this.add('ErroTiposIncompativeis', node.value, 'O comando escolha espera uma expressão do tipo inteiro ou caracter.');
        const before = this.initializationState(); this.switchDepth++;
        const states = [];
        node.cases.forEach(item => {
          this.restore(before);
          if (item.value) { const value = this.expression(item.value); if (choice.type && value.type && choice.type !== value.type) this.add('ErroTiposIncompativeis', item.value, `O caso deve ter o mesmo tipo da expressão escolha: ${choice.type}.`); }
          this.list(item.statements); states.push(this.initializationState());
        });
        this.switchDepth--; this.restore(before);
        if (node.cases.some(item => !item.value)) before.forEach((_, symbol) => { symbol.initialized = states.every(state => state.get(symbol)?.initialized); });
        return this.returns(node);
      }
      case 'break':
        if (!this.loopDepth && !this.switchDepth) this.diagnostics.push(diagnostic('ErroSintatico.ErroPareForaDeLoopOuSwitch', node, 'O comando pare apenas pode ser utilizado dentro de um laço de repetição ou escolha-caso.'));
        return true;
      case 'return': {
        const value = node.value ? this.expression(node.value) : { type: 'vazio', dimensions: 0 };
        if (this.fn.type !== 'vazio' || node.value) this.convert(value, this.fn.type, this.fn.dimensions.length, node.value || node, 'RetornoFuncao');
        return true;
      }
      case 'unsupported': this.add('ErroComandoNaoSuportado', node, `O comando “${node.name}” não é suportado pela linguagem Portugol.`); break;
    }
    return false;
  }
  hasEscapingBreak(node) {
    if (!node || ['while', 'do', 'for', 'switch'].includes(node.kind)) return false;
    if (node.kind === 'break') return true;
    if (node.kind === 'block') return node.statements.some(item => this.hasEscapingBreak(item));
    if (node.kind === 'if') return this.hasEscapingBreak(node.yes) || this.hasEscapingBreak(node.no);
    return false;
  }
  returns(node) {
    if (!node) return false;
    if (node.kind === 'return') return true;
    if (node.kind === 'block') return node.statements.some(item => this.returns(item));
    if (node.kind === 'if') return this.returns(node.yes) && this.returns(node.no);
    if (node.kind === 'switch') return node.cases.some(item => !item.value) && node.cases.every(item => {
      for (const statement of item.statements) { if (statement.kind === 'break') return false; if (this.returns(statement)) return true; } return false;
    });
    return false;
  }
  analyze() {
    for (const inclusion of this.program.inclusions || []) {
      if (!contracts[inclusion.library]) this.add('ErroInclusaoBiblioteca', inclusion, `A biblioteca “${inclusion.library}” não existe.`);
      if (this.libraries.has(inclusion.alias) || [...this.libraries.values()].includes(inclusion.library)) this.add('ErroInclusaoBiblioteca', inclusion, `A biblioteca ou alias “${inclusion.alias}” já foi incluído no programa.`);
      this.libraries.set(inclusion.alias, inclusion.library);
    }
    for (const fn of this.program.functions) {
      if (this.functions.has(fn.name) || builtins.has(fn.name)) this.add('ErroSimboloRedeclarado', fn, `A função “${fn.name}” já foi declarada ou é reservada pela linguagem.`);
      this.functions.set(fn.name, fn);
      if (fn.dimensions.length) this.diagnostics.push(diagnostic('ErroSintatico.ErroRetornoVetorMatriz', fn, 'Não é possível retornar vetores ou matrizes por funções.'));
      if (fn.name === 'inicio' && fn.parameters.length && !(fn.parameters.length === 1 && fn.parameters[0].type === 'cadeia' && fn.parameters[0].dimensions.length === 1 && !fn.parameters[0].ref)) this.add('ErroFuncaoInicioNaoAceitaParametros', fn, 'A função inicio não aceita estes parâmetros. Utilize inicio() ou inicio(cadeia argumentos[]).');
      if (fn.name === 'inicio' && fn.type !== 'vazio') this.add('ErroFuncaoInicialInvalida', fn, 'A função inicio deve ser do tipo vazio, sem retorno de valor.');
    }
    if (!this.functions.has('inicio')) this.add('ErroFuncaoInicioInexistente', { from: 0, to: 8 }, 'A função inicio() não existe no código. Ela é necessária para iniciar a execução.');
    this.program.globals.forEach(node => this.declaration(node));
    const globals = this.initializationState();
    for (const fn of this.program.functions) {
      this.restore(globals); this.fn = fn; this.scopes.push(new Map());
      fn.parameters.forEach(parameter => { this.declare(parameter, true); if (parameter.type === 'vazio') this.add('ErroTiposIncompativeis', parameter, 'Um parâmetro não pode ter o tipo vazio.'); });
      // O corpo da função compartilha o escopo com seus parâmetros.
      if (fn.body.kind === 'block') this.list(fn.body.statements, false); else this.statement(fn.body);
      if (fn.type !== 'vazio' && !this.returns(fn.body)) this.add('ErroFuncaoSemRetorne', fn, `A função “${fn.name}” possui situações que não retornam nenhum valor. Inclua retorne em todos os caminhos ou no final da função.`);
      this.scopes.pop();
    }
    return this.diagnostics;
  }
}

export function semanticDiagnostics(program) { return new SemanticAnalyzer(program).analyze(); }
