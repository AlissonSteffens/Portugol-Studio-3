import { repairSphere } from './sphere-fix.js';
import { repairRace } from './corrida-fix.js';
export function repairExample(relative, source) {
  if (relative === 'jogos/corrida.por') return {
    source: repairRace(source),
    ajustes: ['Adicionado suporte a WASD; atalhos de abastecimento e dano movidos para B e N.'],
  };
  if (relative === 'bibliotecas/graficos/sphere.por') return {
    source: repairSphere(source),
    ajustes: ['Iluminação calculada pela normal de cada face, com luz ambiente e difusa; removido o cálculo baseado na posição na tela.'],
  };
  if (relative === 'bibliotecas/graficos/varios.por') return {
    source: source.replace(/inteiro idade\b(?!\s*=)/, 'inteiro idade = 0').replace(/real altura\b(?!\s*=)/, 'real altura = 0.0'),
    ajustes: ['Inicializados idade e altura antes das condições para garantir a análise de todos os caminhos de execução.'],
  };
  if (relative === 'bibliotecas/tipos/logico.por') return {
    source: source.replace(/caso\s*\r?\n/, 'caso \'A\':\n                    escreva("\\nCaracter convertido: ", car)\n                    pare\n'),
    ajustes: ['Completado o caso vazio no exemplo original.'],
  };
  if (relative === 'jogos/arkanoid.por') return {
    source: source.replace(/\tfuncao logico bolinha_bateu_bastao\(\)[\s\S]*?(?=\tfuncao real valor_absoluto)/, `\t// Colisão círculo-retângulo: usa o ponto do bastão mais próximo do centro da bola.
    funcao logico bolinha_bateu_bastao()
    {
        real raio = tamanho_bolinha / 2.0
        real centro_x = x_bolinha + raio
        real centro_y = y_bolinha + raio
        real proximo_x = m.maior_numero(x_bastao, m.menor_numero(centro_x, x_bastao + largura_bastao))
        real proximo_y = m.maior_numero(y_bastao, m.menor_numero(centro_y, y_bastao + altura_bastao))
        real distancia_x = centro_x - proximo_x
        real distancia_y = centro_y - proximo_y
        retorne distancia_x * distancia_x + distancia_y * distancia_y <= raio * raio
    }

`),
    ajustes: ['Substituído o bloco de colisões incompleto por colisão círculo-retângulo; a origem tinha parâmetro sem nome e variáveis indefinidas.'],
  };
  return { source, ajustes: [] };
}
