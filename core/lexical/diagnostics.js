import { diagnostic } from '../diagnostics/index.js';

export function lexicalDiagnostics(tokens) {
  const messages = [];
  let offset = 0;
  tokens.forEach((token, index) => {
    const node = { from: offset, to: offset + token.value.length };
    offset = node.to;
    const add = (id, message) => messages.push(diagnostic(`ErroSintatico.${id}`, node, message));
    if (token.type === 'unknown') add('ErroCaracterInvalidoReferencia', `O caractere “${token.value}” não é reconhecido em uma referência.`);
    if (token.type === 'comment' && token.value.startsWith('/*') && !token.value.endsWith('*/')) add('ErroEscopo', 'O comentário não foi fechado. Insira */ para corrigir o problema.');
    if (['string', 'char'].includes(token.type)) {
      const quote = token.value[0];
      if (token.value.length < 2 || token.value.at(-1) !== quote || /(?<!\\)(?:\\\\)*\\$/.test(token.value.slice(1, -1))) add('ErroCadeiaIncompleta', `O literal não foi finalizado corretamente. Insira ${quote} para fechá-lo.`);
      else {
        if (/[\r\n]/.test(token.value)) add('ErroLinhaPuladaEmString', 'Você pulou uma linha ao escrever uma cadeia. Cadeias devem ser escritas em uma mesma linha; utilize \\n para uma quebra de linha.');
        if (/\\[^nrtbfa\\"']/.test(token.value.slice(1, -1).replace(/\\\\/g, ''))) add('ErroEscapeUnico', 'Sequência de escape inválida. Utilize \\n, \\t ou \\\\ para representar uma barra invertida.');
        if (token.type === 'char' && token.value.slice(1, -1).replace(/\\./g, 'x').length !== 1) add('ErroExpressaoInesperada', 'Um literal do tipo caracter deve conter exatamente um caractere.');
      }
    }
    if (token.type === 'number' && !token.value.includes('.') && !/^0x/i.test(token.value)) {
      const previous = tokens.slice(0, index).filter(t => !['whitespace', 'comment'].includes(t.type));
      const unaryMinus = previous.at(-1)?.value === '-' && (!previous.at(-2) || ['=', '(', '[', ',', 'retorne', '+', '-', '*', '/'].includes(previous.at(-2).value));
      if (Number(token.value) > (unaryMinus ? 2147483648 : 2147483647)) add('ErroInteiroForaDoIntervalo', `O número ${token.value} está fora do intervalo de 32 bits. Digite um número entre -2147483648 e 2147483647.`);
    }
  });
  return messages;
}
