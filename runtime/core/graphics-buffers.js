import { recordingContext } from './recording-context.js';
import { runtimeError } from './diagnostics.js';

export function installGraphicsBuffers(runtime) {
  const buffers = new Map(); let nextId = 1, pixels = 0, active = 0;
  const main = { canvas: runtime.bufferCanvas, raw: runtime.__rawBCtx, drawing: runtime.__drawing };
  runtime.__mainDrawing = main.drawing;
  const entry = id => {
    if (id === 0) return main;
    const value = buffers.get(id);
    if (!value) throw runtimeError('ErroExecucaoBiblioteca', 'Buffer gráfico inválido ou já liberado.');
    return value;
  };
  const use = id => {
    const target = entry(id);
    if (active !== id) runtime.__drawing.clear();
    active = id; runtime.bCtx = target.drawing.context;
    runtime.__rawBCtx = target.raw; runtime.__drawing = target.drawing;
    runtime.__drawingWidth = target.canvas.width; runtime.__drawingHeight = target.canvas.height;
    runtime.bCtx.fillStyle = runtime.currentColor; runtime.bCtx.strokeStyle = runtime.currentColor;
    runtime._updateFont();
  };
  Object.assign(runtime.Graficos, {
    criar_buffer(width, height) {
      const size = width * height;
      if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || size > 16_000_000 || pixels + size > (runtime.options.maxBufferPixels || 32_000_000)) throw runtimeError('ErroMemoriaInsuficiente', 'Tamanho de buffer inválido ou memória dos buffers excedida. Libere buffers que não estão sendo utilizados.');
      const canvas = runtime.createCanvas(); canvas.width = width; canvas.height = height;
      const raw = canvas.getContext('2d'), id = nextId++;
      buffers.set(id, { canvas, raw, drawing: recordingContext(raw), size }); pixels += size;
      return id;
    },
    usar_buffer: use,
    desenhar_buffer(x, y, id) {
      if (id === active) throw runtimeError('ErroExecucaoBiblioteca', 'Um buffer não pode ser desenhado sobre ele mesmo. Escolha outro destino com usar_buffer.');
      const source = entry(id).canvas, context = runtime.bCtx;
      if (!runtime.__rotation && runtime.currentOpacity === 255) { context.drawImage(source, x, y); return; }
      context.save();
      try {
        context.globalAlpha = runtime.currentOpacity / 255;
        if (runtime.__rotation) { context.translate(x, y); context.rotate(runtime.__rotation * Math.PI / 180); context.translate(-x, -y); }
        context.drawImage(source, x, y);
      } finally { context.restore(); }
    },
    limpar_buffer(id) {
      const value = entry(id), context = value.drawing.context;
      value.drawing.clear(); context.save(); context.resetTransform();
      context.clearRect(0, 0, value.canvas.width, value.canvas.height); context.restore();
    },
    liberar_buffer(id) {
      if (id === 0) throw runtimeError('ErroExecucaoBiblioteca', 'A janela gráfica não pode ser liberada como um buffer.');
      const value = entry(id); if (active === id) use(0);
      value.canvas.width = 0; value.canvas.height = 0; value.drawing.clear();
      pixels -= value.size; buffers.delete(id);
    },
  });
  const resize = runtime.Graficos.definir_dimensoes_janela;
  runtime.Graficos.definir_dimensoes_janela = (...args) => { use(0); resize(...args); runtime.__drawingWidth = main.canvas.width; runtime.__drawingHeight = main.canvas.height; };
  runtime.__disposeBuffers = () => {
    for (const [id] of buffers) runtime.Graficos.liberar_buffer(id);
    runtime.__drawing.clear();
  };
}
