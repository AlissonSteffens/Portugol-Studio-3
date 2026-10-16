export function repairRace(source) {
  if (source.includes('// Controles: W ou seta acima')) return source;
  // Preserve the original arrow controls and move debug cheats away from WASD.
  source = source.replaceAll('t.tecla_pressionada(t.TECLA_A)', 't.tecla_pressionada(t.TECLA_B)')
    .replaceAll('t.tecla_pressionada(t.TECLA_D)', 't.tecla_pressionada(t.TECLA_N)');
  for (const [original, alternative] of [['ESPACO', 'S'], ['SETA_ACIMA', 'W'], ['SETA_ESQUERDA', 'A'], ['SETA_DIREITA', 'D']]) {
    const key = `t.tecla_pressionada(t.TECLA_${original})`;
    const combined = `(${key} ou t.tecla_pressionada(t.TECLA_${alternative}))`;
    source = source.replaceAll(key, combined);
  }
  const hint = '\t// Controles: W ou seta acima acelera; A/D ou setas viram; S ou espaco freia.\n\t// Atalhos de teste: B abastece, N causa dano, R repara e 0 reinicia o carro.\n';
  if (!source.includes('// Controles: W ou seta acima')) source = source.replace('\tfuncao ler_entrada_usuario()', hint + '\tfuncao ler_entrada_usuario()');
  return source;
}
