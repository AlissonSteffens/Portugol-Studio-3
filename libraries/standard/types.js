export function installTypesLibrary(runtime) {
  const self = runtime;
  // ==================== BIBLIOTECA TIPOS ====================
  runtime.Tipos = {
      real_para_inteiro(v) { return Math.trunc(v); },
      inteiro_para_real(v) { return Number(v); },
      inteiro_para_cadeia(v, base = 10) { return Number(v).toString(base); },
      real_para_cadeia(v) { return String(v); },
      cadeia_para_inteiro(v, base = 10) { return parseInt(v, base); },
      cadeia_para_real(v) { return parseFloat(v); },
      cadeia_para_caracter(v) { return String(v)[0] || ''; },
      caracter_para_cadeia(v) { return String(v); },
      logico_para_cadeia(v) { return v ? 'verdadeiro' : 'falso'; },
      cadeia_e_inteiro(s, base = 10) { return !isNaN(parseInt(s, base)); },
      cadeia_e_real(s) { return !isNaN(parseFloat(s)); },
      caracter_e_logico(c) { return ['S', 's', 'N', 'n', 'V', 'v', 'F', 'f'].includes(c); },
      caracter_para_logico(c) { return ['S', 's', 'V', 'v'].includes(c); }
  };
}
