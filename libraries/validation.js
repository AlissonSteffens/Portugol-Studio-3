import { runtimeError } from '../core/diagnostics/index.js';

// Pré-condições e mensagens das bibliotecas Java; evita que o JavaScript
// transforme entradas inválidas silenciosamente (charAt, substring, cores).
export function validateLibraryCall(library, name, args) {
  const fail = message => { throw runtimeError('ErroExecucaoBiblioteca', message); };
  if (library === 'Graficos' && name === 'criar_cor' && args.some(value => value < 0 || value > 255)) fail('Erro ao criar a cor: os valores dos tons devem estar entre 0 e 255.');
  if (library === 'Graficos' && name === 'redimensionar_imagem' && args[1] <= 0 && args[2] <= 0) fail('Impossível transformar imagem para estas dimensões.');
  if (library === 'Texto' && name === 'obter_caracter') {
    if (args[1] < 0) fail(`O índice do caracter (${args[1]}) é menor que 0.`);
    if (args[1] >= args[0].length) fail(`O índice do caracter (${args[1]}) é maior que o número de caracteres na cadeia (${args[0].length}).`);
  }
  if (library === 'Texto' && name === 'extrair_subtexto' && (args[1] < 0 || args[2] < args[1] || args[2] > args[0].length)) fail('Posição inicial ou final inválida. A posição deve estar entre 0 e o tamanho da cadeia.');
  if (library === 'Tipos') {
    if (['cadeia_e_inteiro', 'cadeia_para_inteiro', 'inteiro_para_cadeia'].includes(name) && ![2, 10, 16].includes(args[1] ?? 10)) fail(`A base informada (${args[1]}) é inválida. A base deve ser 2, 10 ou 16.`);
    if (name === 'cadeia_para_caracter' && args[0].length !== 1) fail(`O valor “${args[0]}” não é um caracter válido.`);
    if (name === 'caracter_para_logico' && !['S', 's', 'N', 'n'].includes(args[0])) fail(`O valor “${args[0]}” não é um valor lógico válido. Utilize S ou N.`);
  }
}
