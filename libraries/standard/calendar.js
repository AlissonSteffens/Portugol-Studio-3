export function installCalendarLibrary(runtime) {
  const self = runtime;
  // ==================== BIBLIOTECA CALENDARIO ====================
  runtime.Calendario = {
      hora_atual(f24 = true) {
          const h = new Date().getHours();
          return f24 ? h : (h % 12 || 12);
      },
      minuto_atual() { return new Date().getMinutes(); },
      segundo_atual() { return new Date().getSeconds(); },
      milisegundo_atual() { return new Date().getMilliseconds(); },
      dia_mes_atual() { return new Date().getDate(); },
      dia_semana_atual() { return new Date().getDay() + 1; },
      mes_atual() { return new Date().getMonth() + 1; },
      ano_atual() { return new Date().getFullYear(); }
  };
}
