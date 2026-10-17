import test from 'node:test';
import assert from 'node:assert/strict';
import { splitStudioMetadata, normalizeStudioDocument, serializeStudioDocument } from '../ide/src/services/studio-metadata.js';

const metadata = '/* $$$ Portugol Studio $$$\n * @POSICAO-CURSOR = 932;\n * @DOBRAMENTO-CODIGO = [1];\n */';

test('metadados são separados do código e preservados ao salvar', () => {
  const code = '// Comentário do aluno\nprograma { funcao inicio() {} }\n';
  const source = code + '\n' + metadata + '\n';
  const document = normalizeStudioDocument({ code: source, savedCode: source });
  assert.equal(document.code, code);
  assert.equal(document.savedCode, code);
  assert.equal(document.studioMetadata, metadata);
  assert.equal(serializeStudioDocument(document), source);
  const edited = { ...document, code: code.replace('{}', '{ escreva(1) }') };
  assert.equal(splitStudioMetadata(serializeStudioDocument(edited)).code, edited.code);
  assert.equal(normalizeStudioDocument(edited).studioMetadata, metadata);
});

test('comentários normais, textos com o marcador e blocos incompletos continuam visíveis', () => {
  for (const source of [
    '/* Explicação: @POSICAO-CURSOR = 12 */\nprograma {}',
    'programa { funcao inicio() { escreva("/* $$$ Portugol Studio $$$ */") } }',
    '// /* $$$ Portugol Studio $$$ */\nprograma {}',
    '/* Documentação sobre $$$ Portugol Studio $$$ */\nprograma {}',
    'programa {}\n/* $$$ Portugol Studio $$$\n * @POSICAO-CURSOR = 12;',
  ]) assert.deepEqual(splitStudioMetadata(source), { code: source, studioMetadata: '' });
});

test('metadados no meio do arquivo não escondem comandos posteriores nem unem tokens', () => {
  const source = `programa {\n${metadata}\nfuncao inicio() { inteiro${metadata}valor = 1 escreva(valor) }\n}`;
  const result = splitStudioMetadata(source);
  assert.equal(result.code, 'programa {\nfuncao inicio() { inteiro valor = 1 escreva(valor) }\n}');
  assert.equal(result.studioMetadata, metadata + '\n\n' + metadata);
});

test('sessões antigas migram código e versão salva sem marcar alteração falsa', () => {
  const source = 'programa {}\r\n\r\n' + metadata.replaceAll('\n', '\r\n');
  const document = normalizeStudioDocument({ code: source, savedCode: source });
  assert.equal(document.code, document.savedCode);
  assert.equal(normalizeStudioDocument(document).studioMetadata, document.studioMetadata);
  assert.equal(serializeStudioDocument({ code: 'programa {}\n' }), 'programa {}\n');
});
