import { Parser } from './syntax/parser.js';
import { Generator } from './transpilation/generator.js';
import { diagnostic, diagnosticError } from './diagnostics/index.js';
import { lexicalDiagnostics } from './lexical/diagnostics.js';
import { semanticDiagnostics } from './semantic/analyzer.js';
export { parseProgram } from './syntax/parser.js';

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
