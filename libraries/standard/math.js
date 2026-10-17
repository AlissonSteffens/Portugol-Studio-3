export function installMathLibrary(runtime) {
  const self = runtime;
  // ==================== BIBLIOTECA MATEMATICA ====================
  runtime.Matematica = {
      PI: Math.PI,
      seno(ang) { return Math.sin(ang); },
      cosseno(ang) { return Math.cos(ang); },
      tangente(ang) { return Math.tan(ang); },
      raiz(rad, ind) { return Math.pow(rad, 1.0 / ind); },
      potencia(base, exp) { return Math.pow(base, exp); },
      arredondar(num, casas) {
          const factor = Math.pow(10, casas);
          return Math.round(num * factor) / factor;
      },
      valor_absoluto(n) { return Math.abs(n); },
      maior_numero(a, b) { return Math.max(a, b); },
      menor_numero(a, b) { return Math.min(a, b); }
  };
}
