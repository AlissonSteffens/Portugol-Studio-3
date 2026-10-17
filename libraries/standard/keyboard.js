export function installKeyboardLibrary(runtime) {
  const self = runtime;
  // ==================== BIBLIOTECA TECLADO ====================
  runtime.Teclado = {
      TECLA_ENTER: 10,
      TECLA_BACKSPACE: 8,
      TECLA_TAB: 9,
      TECLA_SHIFT: 16,
      TECLA_CONTROL: 17,
      TECLA_ALT: 18,
      TECLA_ESC: 27,
      TECLA_ESPACO: 32,
      TECLA_SETA_ESQUERDA: 37,
      TECLA_SETA_ACIMA: 38,
      TECLA_SETA_DIREITA: 39,
      TECLA_SETA_ABAIXO: 40,
      TECLA_MENOS: 45,
      TECLA_IGUAL: 61,
      TECLA_ADICAO: 107,
      TECLA_SUBTRACAO: 109,
      TECLA_A: 65, TECLA_B: 66, TECLA_C: 67, TECLA_D: 68, TECLA_E: 69,
      TECLA_F: 70, TECLA_G: 71, TECLA_H: 72, TECLA_I: 73, TECLA_J: 74,
      TECLA_K: 75, TECLA_L: 76, TECLA_M: 77, TECLA_N: 78, TECLA_O: 79,
      TECLA_P: 80, TECLA_Q: 81, TECLA_R: 82, TECLA_S: 83, TECLA_T: 84,
      TECLA_U: 85, TECLA_V: 86, TECLA_W: 87, TECLA_X: 88, TECLA_Y: 89,
      TECLA_Z: 90,
      TECLA_0: 48, TECLA_1: 49, TECLA_2: 50, TECLA_3: 51, TECLA_4: 52,
      TECLA_5: 53, TECLA_6: 54, TECLA_7: 55, TECLA_8: 56, TECLA_9: 57,

      tecla_pressionada(codigo) {
          if (codigo === 10 && self.__keyStates.get(13)) return true;
          return !!self.__keyStates.get(codigo);
      },

      alguma_tecla_pressionada() {
          for (let [, pressed] of self.__keyStates) {
              if (pressed) return true;
          }
          return false;
      },

      caracter_tecla(tecla) {
          if (tecla >= 65 && tecla <= 90) return String.fromCharCode(tecla).toLowerCase();
          if (tecla >= 48 && tecla <= 57) return String.fromCharCode(tecla);
          if (tecla === 32) return ' ';
          return '';
      },

      async ler_tecla() {
          return new Promise(resolve => {
              self.__keyWaitResolvers.push(resolve);
          });
      }
  };
}
