import { installFullscreen } from '../runtime/fullscreen.js';

export function installBrowserLibraries(runtime) {
  const loadedFonts = new Set();
  runtime.Util.obter_diretorio_usuario = () => 'usuario';
  runtime.Util.obter_diretorio_programa = () => '.';
  const g = runtime.Graficos, mouse = runtime.Mouse, types = runtime.Tipos;
  const image = id => { const value = runtime.__images.get(id); if (!value) throw new Error('Imagem não encontrada: ' + id); return value; };
  const store = canvas => { const id = runtime.__nextImageId++; runtime.__images.set(id, canvas); return id; };
  const canvas = (width, height) => {
    if (width <= 0 || height <= 0 || width * height > 16_000_000) throw new Error('Dimensões de imagem inválidas.');
    const node = document.createElement('canvas'); node.width = width; node.height = height; return node;
  };
  Object.assign(g, {
    redimensionar_imagem(id, width, height, quality = true) {
      const original = image(id);
      if (!width && height) width = Math.round(original.width * height / original.height);
      if (!height && width) height = Math.round(original.height * width / original.width);
      const output = canvas(width, height), context = output.getContext('2d');
      context.imageSmoothingEnabled = quality; context.drawImage(original, 0, 0, width, height); return store(output);
    },
    transformar_imagem(id, horizontal, vertical, rotation, ignoredColor = -1) {
      const original = image(id), radians = rotation * Math.PI / 180;
      const width = Math.max(1, Math.round(Math.abs(original.width * Math.cos(radians)) + Math.abs(original.height * Math.sin(radians))));
      const height = Math.max(1, Math.round(Math.abs(original.height * Math.cos(radians)) + Math.abs(original.width * Math.sin(radians))));
      const source = canvas(original.width, original.height), sourceContext = source.getContext('2d'); sourceContext.drawImage(original, 0, 0);
      if (ignoredColor !== -1) {
        const pixels = sourceContext.getImageData(0, 0, source.width, source.height);
        for (let i = 0; i < pixels.data.length; i += 4) if (((pixels.data[i] << 16) | (pixels.data[i + 1] << 8) | pixels.data[i + 2]) === (ignoredColor & 0xffffff)) pixels.data[i + 3] = 0;
        sourceContext.putImageData(pixels, 0, 0);
      }
      const output = canvas(width, height), context = output.getContext('2d');
      context.translate(width / 2, height / 2); context.rotate(radians); context.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
      context.drawImage(source, -original.width / 2, -original.height / 2); return store(output);
    },
    async carregar_fonte(path) {
      const blob = await runtime.options.files.blob(path);
      const font = new FontFace(path.split('/').pop().replace(/\.[^.]+$/, ''), await blob.arrayBuffer());
      await font.load();
      if (runtime.__aborted) throw new Error('EXECUCAO_INTERROMPIDA');
      document.fonts.add(font); loadedFonts.add(font);
      // Os nomes internos dos TTF podem diferir do nome do arquivo.
      runtime.__loadedFont = font.family;
    },
    definir_icone_janela(id) {
      const original = image(id), node = canvas(original.width, original.height); node.getContext('2d').drawImage(original, 0, 0);
      const doc = runtime.canvas?.ownerDocument || document;
      let icon = doc.querySelector('link[data-portugol-icon]');
      if (!icon) { icon = doc.createElement('link'); icon.rel = 'icon'; icon.dataset.portugolIcon = ''; doc.head.appendChild(icon); }
      icon.href = node.toDataURL();
    },
    fechar_janela() { if (runtime.canvas) runtime.canvas.style.visibility = 'hidden'; },
    minimizar_janela() { if (runtime.canvas) runtime.canvas.style.visibility = 'hidden'; },
    restaurar_janela() { if (runtime.canvas) runtime.canvas.style.visibility = 'visible'; },
    ocultar_borda_janela() { if (runtime.canvas) runtime.canvas.style.border = 'none'; },
    exibir_borda_janela() { if (runtime.canvas) runtime.canvas.style.border = '1px solid #43454a'; },
    definir_opacidade(value) { runtime.currentOpacity = Math.min(255, Math.max(0, value)); },
    definir_rotacao(degrees) { runtime.__rotation = degrees; },
  });
  installFullscreen(runtime);
  const initiate = g.iniciar_modo_grafico;
  g.iniciar_modo_grafico = (...args) => { if (runtime.canvas) runtime.canvas.style.visibility = 'visible'; initiate(...args); };
  const font = g.definir_fonte_texto;
  g.definir_fonte_texto = name => font(runtime.__loadedFont ? `"${name}", "${runtime.__loadedFont}"` : name);
  for (const method of ['desenhar_retangulo', 'desenhar_elipse', 'desenhar_linha', 'desenhar_ponto', 'desenhar_poligono', 'desenhar_texto', 'desenhar_imagem', 'desenhar_porcao_imagem']) {
    const original = g[method];
    g[method] = (...args) => {
      if (!runtime.__rotation && runtime.currentOpacity === 255) return original(...args);
      runtime.bCtx.save();
      try { runtime.bCtx.globalAlpha = runtime.currentOpacity / 255; if (runtime.__rotation) { const x = Number(args[0]) || 0, y = Number(args[1]) || 0; runtime.bCtx.translate(x, y); runtime.bCtx.rotate(runtime.__rotation * Math.PI / 180); runtime.bCtx.translate(-x, -y); } return original(...args); }
      finally { runtime.bCtx.restore(); }
    };
  }
  mouse.exibir_cursor = () => { if (runtime.canvas) runtime.canvas.style.cursor = 'default'; };
  mouse.ocultar_cursor = () => { if (runtime.canvas) runtime.canvas.style.cursor = 'none'; };
  Object.assign(runtime.Teclado, { TECLA_DELETAR: 127, TECLA_PAGE_UP: 33, TECLA_PAGE_DOWN: 34 });
  runtime.Matematica.logaritmo = (value, base) => { if (value <= 0 || base <= 0 || base === 1) throw new Error('Número ou base inválida para logaritmo.'); return Math.log(value) / Math.log(base); };
  Object.assign(types, {
    cadeia_e_caracter: value => value.length === 1,
    cadeia_e_logico: value => ['verdadeiro', 'falso'].includes(value),
    inteiro_para_cadeia(value, base = 10) {
      if (![2, 10, 16].includes(base)) throw new Error('A base deve ser 2, 10 ou 16.');
      return base === 10 ? String(value) : (value >>> 0).toString(base).toUpperCase().padStart(base === 2 ? 32 : 8, '0');
    },
    cadeia_para_caracter(value) { if (value.length !== 1) throw new Error('O valor não é um caracter válido.'); return value; },
    caracter_e_logico: value => ['S', 's', 'N', 'n'].includes(value),
    caracter_para_logico(value) { if (!['S', 's', 'N', 'n'].includes(value)) throw new Error('O valor não é um valor lógico válido. Utilize S ou N.'); return value.toLowerCase() === 's'; },
    cadeia_para_logico(value) { if (!types.cadeia_e_logico(value)) throw new Error('Valor lógico inválido: ' + value); return value === 'verdadeiro'; },
    cadeia_e_inteiro(value, base = 10) {
      if (![2, 10, 16].includes(base)) throw new Error('Base deve ser 2, 10 ou 16.');
      return ({ 2: /^[+-]?(?:0b)?[01]+$/i, 10: /^[+-]?\d+$/, 16: /^[+-]?(?:0x)?[0-9a-f]+$/i })[base].test(value);
    },
    cadeia_para_inteiro(value, base = 10) { if (!types.cadeia_e_inteiro(value, base)) throw new Error('Inteiro inválido: ' + value); return parseInt(value.replace(/^([+-]?)0[bBxX]/, '$1'), base); },
    cadeia_e_real: value => /^[+-]?(?:\d+\.\d*|\d*\.\d+|\d+)$/.test(value),
    cadeia_para_real(value) { if (!types.cadeia_e_real(value)) throw new Error('Real inválido: ' + value); return Number(value); },
    inteiro_e_caracter: value => value >= 0 && value <= 9,
    inteiro_para_caracter(value) { if (!types.inteiro_e_caracter(value)) throw new Error('O inteiro deve estar entre 0 e 9.'); return String(value); },
    inteiro_para_logico: value => value > 0,
    caracter_e_inteiro: value => /^\d$/.test(value),
    caracter_para_inteiro(value) { if (!types.caracter_e_inteiro(value)) throw new Error('Caracter não representa um inteiro.'); return Number(value); },
    logico_para_inteiro: value => value ? 1 : 0,
  });
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const day = (index, upper, lower, short) => {
    if (index < 1 || index > 7) throw new Error('Dia da semana deve estar entre 1 e 7.');
    const name = short ? days[index - 1].slice(0, short) : days[index - 1]; return upper ? name.toUpperCase() : lower ? name.toLowerCase() : name;
  };
  Object.assign(runtime.Calendario, {
    hora_atual: format12 => format12 ? new Date().getHours() % 12 || 12 : new Date().getHours(),
    dia_semana_completo: (index, upper, lower) => day(index, upper, lower),
    dia_semana_curto: (index, upper, lower) => day(index, upper, lower, 3),
    dia_semana_abreviado: (index, upper, lower) => day(index, upper, lower, 3),
  });

  let nextSound = 1, volume = 100;
  const sounds = new Map();
  let masterVolume = Math.min(100, Math.max(0, runtime.options.masterVolume ?? 100));
  const updateVolume = item => { item.audio.volume = volume * item.volume * masterVolume / 1000000; };
  // O volume da IDE multiplica os volumes definidos pelo programa.
  runtime.setMasterVolume = value => { masterVolume = Math.min(100, Math.max(0, value)); for (const item of sounds.values()) updateVolume(item); };
  const sound = id => { const item = sounds.get(id); if (!item) throw new Error('Som não encontrado: ' + id); return item; };
  runtime.Sons = {
    async carregar_som(path) {
      const blob = await runtime.options.files.blob(path), url = URL.createObjectURL(blob), audio = new Audio(url);
      try { await new Promise((resolve, reject) => { audio.addEventListener('loadedmetadata', resolve, { once: true }); audio.addEventListener('error', () => reject(new Error('Não foi possível carregar o som: ' + path)), { once: true }); audio.preload = 'auto'; audio.load(); }); }
      catch (error) { URL.revokeObjectURL(url); throw error; }
      if (runtime.__aborted) { URL.revokeObjectURL(url); throw new Error('EXECUCAO_INTERROMPIDA'); }
      const id = nextSound++; sounds.set(id, { audio, url, volume: 100 }); return id;
    },
    async reproduzir_som(id, repeat = false) { const item = sound(id); item.audio.loop = repeat; updateVolume(item); await item.audio.play(); return id; },
    pausar_som(id) { sound(id).audio.pause(); },
    interromper_som(id) { const item = sound(id); item.audio.pause(); item.audio.currentTime = 0; },
    liberar_som(id) { const item = sound(id); item.audio.pause(); URL.revokeObjectURL(item.url); sounds.delete(id); },
    obter_tamanho_musica(id) { return Math.round(sound(id).audio.duration * 1000); },
    obter_posicao_atual_musica(id) { return Math.round(sound(id).audio.currentTime * 1000); },
    definir_posicao_atual_musica(id, milliseconds) { sound(id).audio.currentTime = Math.max(0, milliseconds / 1000); },
    definir_volume_reproducao(id, value) { const item = sound(id); item.volume = Math.min(100, Math.max(0, value)); updateVolume(item); },
    obter_volume_reproducao(id) { return sound(id).volume; },
    definir_volume(value) { volume = Math.min(100, Math.max(0, value)); for (const item of sounds.values()) updateVolume(item); },
    obter_volume() { return volume; },
  };
  runtime.__disposeMedia = () => {
    for (const font of loadedFonts) document.fonts.delete(font); loadedFonts.clear();
    for (const item of sounds.values()) { item.audio.pause(); URL.revokeObjectURL(item.url); } sounds.clear();
    g.sair_modo_tela_cheia();
  };
  let timeout = 10000;
  runtime.__networkController = new AbortController();
  async function remote(url) {
    const target = url;
    let response;
    try { response = await fetch(target, { signal: AbortSignal.any([AbortSignal.timeout(timeout + 1000), runtime.__networkController.signal]) }); }
    catch (error) { if (runtime.__aborted) throw new Error('EXECUCAO_INTERROMPIDA'); if (error.name === 'TimeoutError') throw new Error('Tempo limite excedido ao acessar: ' + url); throw new Error('Não foi possível acessar ' + url + '. O site precisa permitir acesso pelo navegador (CORS).', { cause: error }); }
    if (!response.ok) throw new Error('Endereço indisponível: ' + url); return response;
  }
  runtime.Internet = {
    definir_tempo_limite(value) { timeout = Math.max(1, value); },
    async obter_texto(url) { return (await remote(url)).text(); },
    async endereco_disponivel(url) { try { await remote(url); return true; } catch (error) { console.warn('Endereço indisponível:', url, error); return false; } },
    async baixar_imagem(url, path) { const response = await remote(url); const blob = await response.blob(), extension = /jpe?g/.test(blob.type) ? 'jpg' : 'png'; await runtime.options.files.writeBlob(path + '.' + extension, blob); return extension; },
  };
}
