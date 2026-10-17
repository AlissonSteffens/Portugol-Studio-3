import { compile } from '../compiler.js';
import { tokenize } from '../lexical/tokenizer.js';
export { tokenize } from '../lexical/tokenizer.js';

export function transpilePortugol(source, options = {}) {
  return compile(tokenize(source), options);
}
