export function installMouseLibrary(runtime) {
  const self = runtime;
  // ==================== BIBLIOTECA MOUSE ====================
  runtime.Mouse = {
      BOTAO_ESQUERDO: 0,
      BOTAO_DIREITO: 1,
      BOTAO_MEIO: 2,

      posicao_x() {
          return self.__mouseX;
      },

      posicao_y() {
          return self.__mouseY;
      },

      botao_pressionado(botao) {
          return !!self.__mouseButtons[botao];
      },

      algum_botao_pressionado() {
          return self.__mouseButtons.some(b => !!b);
      },

      ler_botao() {
          return self.__mouseButtons[0] ? 0 : (self.__mouseButtons[1] ? 1 : (self.__mouseButtons[2] ? 2 : -1));
      }
  };
}
