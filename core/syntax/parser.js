import { diagnostic, diagnosticError } from '../diagnostics/index.js';
import { reservedWords } from '../lexical/keywords.js';
import { PRECEDENCE } from './operators.js';
const TYPES = new Set(['inteiro', 'real', 'cadeia', 'caracter', 'logico', 'vazio']);

export class Parser {
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

export function parseProgram(tokens) { return new Parser(tokens).program(); }
