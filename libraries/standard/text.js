export function installTextLibrary(runtime) {
  const self = runtime;
  // ==================== BIBLIOTECA TEXTO ====================
  runtime.Texto = {
      numero_caracteres(s) { return String(s).length; },
      tamanho(s) { return String(s).length; },
      caixa_alta(s) { return String(s).toUpperCase(); },
      caixa_baixa(s) { return String(s).toLowerCase(); },
      substituir(s, b, subst) { return String(s).split(b).join(subst); },
      preencher_a_esquerda(car, tam, s) { return String(s).padStart(tam, car); },
      preencher_a_direita(car, tam, s) { return String(s).padEnd(tam, car); },
      subtexto(s, ini, fim) { return String(s).substring(ini, fim); },
      extrair_subtexto(s, ini, fim) { return String(s).substring(ini, fim); },
      posicao_texto(busca, texto, inicio = 0) {
          return String(texto).indexOf(String(busca), Math.max(0, inicio));
      },
      pesquisar_texto(busca, texto, inicio = 0) {
          return String(texto).indexOf(String(busca), Math.max(0, inicio));
      },
      obter_caracter(s, pos) {
          return String(s).charAt(pos) || '';
      }
  };
}
