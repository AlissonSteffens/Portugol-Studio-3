import { tokenize } from '../../../core/lexical/tokenizer.js';

const studioHeader = /^\/\*\s*\$\$\$\s+Portugol Studio\s+\$\$\$(?=\s|\*)/;

export function splitStudioMetadata(source) {
  if (!source.includes('$$$')) return { code: source, studioMetadata: '' };
  const metadata = [], removals = [];
  let offset = 0;
  for (const token of tokenize(source)) {
    const start = offset; offset += token.value.length;
    if (token.type !== 'comment' || !studioHeader.test(token.value) || !token.value.endsWith('*/')) continue;
    metadata.push(token.value);
    const lineStart = source.lastIndexOf('\n', start - 1) + 1;
    const nextLine = source.indexOf('\n', offset);
    const lineEnd = nextLine < 0 ? source.length : nextLine;
    const standalone = /^[\t \r]*$/.test(source.slice(lineStart, start)) && /^[\t \r]*$/.test(source.slice(offset, lineEnd));
    removals.push(standalone ? { from: lineStart, to: nextLine < 0 ? lineEnd : nextLine + 1, insert: '' } : { from: start, to: offset, insert: ' ' });
  }
  let code = source;
  for (const removal of [...removals].reverse()) code = code.slice(0, removal.from) + removal.insert + code.slice(removal.to);
  if (removals.length && !source.slice(removals.at(-1).to).trim()) code = code.trimEnd() + '\n';
  return { code, studioMetadata: metadata.join('\n\n') };
}

export function normalizeStudioDocument(document) {
  const source = splitStudioMetadata(document.code), saved = splitStudioMetadata(document.savedCode ?? document.code);
  return { ...document, code: source.code, savedCode: saved.code, studioMetadata: source.studioMetadata || (typeof document.studioMetadata === 'string' ? document.studioMetadata : '') || saved.studioMetadata };
}

export function serializeStudioDocument(document) {
  return document.studioMetadata ? document.code.trimEnd() + '\n\n' + document.studioMetadata + '\n' : document.code;
}
