// API da linguagem, utilizável sem a IDE ou um ambiente de navegador.
export { tokenize } from './lexical/tokenizer.js';
export { lexicalDiagnostics } from './lexical/diagnostics.js';
export { Parser, parseProgram } from './syntax/parser.js';
export { semanticDiagnostics } from './semantic/analyzer.js';
export { analyzeTokens, compile } from './compiler.js';
export { transpilePortugol } from './transpilation/transpiler.js';
export { ExecutionDebugger } from './execution/debugger.js';
