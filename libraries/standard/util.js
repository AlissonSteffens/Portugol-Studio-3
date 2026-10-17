export function installUtilLibrary(runtime) {
  const self = runtime;
  // ==================== BIBLIOTECA UTIL ====================
  runtime.Util = {
      async aguarde(ms) {
          if (self.__aborted) throw new Error("EXECUCAO_INTERROMPIDA");
          await self.waitForDelay(ms);
          if (self.__aborted) throw new Error("EXECUCAO_INTERROMPIDA");
      },
      tempo_decorrido() {
          return Math.floor(performance.now() - self.__startTime);
      },
      sorteia(min, max) {
          if (min > max) throw runtimeError('ErroExecucaoBiblioteca', `O valor mínimo (${min}) é maior do que o valor máximo (${max}).`);
          if (min === max) throw runtimeError('ErroExecucaoBiblioteca', `Os valores mínimo e máximo são iguais: ${min}.`);
          return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      numero_elementos(vetor) {
          return Array.isArray(vetor) ? vetor.length : 0;
      },
      numero_linhas(matriz) {
          return Array.isArray(matriz) ? matriz.length : 0;
      },
      numero_colunas(matriz) {
          return (Array.isArray(matriz) && matriz[0] && Array.isArray(matriz[0])) ? matriz[0].length : 0;
      },
      obter_diretorio_usuario() {
          return "/home/usuario";
      }
  };
}
