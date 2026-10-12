// Checkpoints suspend the actual interpreter, preserving its promises and locals.
export class ExecutionDebugger {
  constructor({ onPause, breakpoints = [], lineAt = () => 0 } = {}) {
    this.onPause = onPause; this.breakpoints = new Set(breakpoints); this.lineAt = lineAt;
    this.mode = 'into'; this.depth = Infinity; this.frames = [];
  }
  enter(name) { this.frames.push({ name, symbols: [] }); }
  leave() { this.frames.pop(); }
  inspect(scope, from, symbols) {
    const frame = this.frames.at(-1);
    if (frame) Object.assign(frame, { from, scope, symbols });
  }
  pause() { this.mode = 'into'; }
  resume(mode = 'continue') {
    this.mode = mode; this.depth = this.frames.length;
    const release = this.release; this.release = null; release?.();
  }
  abort() { this.aborted = true; this.release?.(); this.release = null; }
  needsInstrumentation() { return this.mode !== 'continue' || this.breakpoints.size > 0; }
  shouldPause(from) {
    if (this.aborted) throw new Error('EXECUCAO_INTERROMPIDA');
    const depth = this.frames.length;
    return this.mode === 'into' || this.mode === 'over' && depth <= this.depth || this.mode === 'out' && depth < this.depth
      || this.breakpoints.size > 0 && this.breakpoints.has(this.lineAt(from));
  }
  async checkpoint(from, to) {
    if (this.aborted) throw new Error('EXECUCAO_INTERROMPIDA');
    const depth = this.frames.length, line = this.lineAt(from);
    const breakpoint = this.breakpoints.has(line);
    this.lastLine = line; this.lastDepth = depth;
    if (breakpoint || this.mode === 'into' || this.mode === 'over' && depth <= this.depth || this.mode === 'out' && depth < this.depth) {
      await new Promise(resolve => {
        this.release = resolve;
        this.onPause?.({ from, to, line, frames: this.frames.map(frame => ({ ...frame, symbols: frame.symbols.map(symbol => ({ ...symbol })) })) });
      });
    }
    if (this.aborted) throw new Error('EXECUCAO_INTERROMPIDA');
  }
}
