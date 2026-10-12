// Registra os desenhos pendentes para renderizar imagens fora da tela,
// inclusive cenários maiores que a janela gráfica.
export function recordingContext(context) {
  const operations = [], properties = ['fillStyle', 'strokeStyle', 'globalAlpha', 'globalCompositeOperation', 'lineWidth', 'lineCap', 'lineJoin', 'miterLimit', 'font', 'textAlign', 'textBaseline', 'imageSmoothingEnabled', 'shadowBlur', 'shadowColor', 'shadowOffsetX', 'shadowOffsetY'];
  const methods = new Set(['save', 'restore', 'translate', 'rotate', 'scale', 'transform', 'setTransform', 'resetTransform', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'rect', 'roundRect', 'ellipse', 'arc', 'arcTo', 'bezierCurveTo', 'quadraticCurveTo', 'clip', 'fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'drawImage', 'setLineDash']);
  let initial;
  const start = () => { if (!initial) initial = Object.fromEntries(properties.map(key => [key, context[key]])); };
  return {
    context: context && new Proxy(context, {
      get(target, key) {
        const value = target[key];
        if (typeof value !== 'function') return value;
        if (!methods.has(key)) return value.bind(target);
        return (...args) => { start(); operations.push({ key, args }); return value.apply(target, args); };
      },
      set(target, key, value) { start(); operations.push({ key, value }); target[key] = value; return true; },
    }),
    clear() { operations.length = 0; initial = null; },
    render(target) {
      if (initial) Object.assign(target, initial);
      for (const operation of operations) {
        if (operation.args) target[operation.key](...operation.args);
        else target[operation.key] = operation.value;
      }
    },
  };
}
