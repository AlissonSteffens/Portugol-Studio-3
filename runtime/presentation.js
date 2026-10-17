// Pending frames and waits follow the window displaying the running program.
export const presentationMethods = {
  setPresentationWindow(target) {
    this.__presentationWindow = target;
    for (const pending of this.__presentationWaits || []) pending.schedule();
  },
  waitForFrame() { return this.waitForPresentation('frame', 16); },
  waitForDelay(milliseconds) { return this.waitForPresentation('delay', Math.max(0, milliseconds)); },
  waitForPresentation(kind, milliseconds) {
    if (this.__aborted) return Promise.reject(new Error('EXECUCAO_INTERROMPIDA'));
    this.__presentationWaits ||= new Set();
    return new Promise((resolve, reject) => {
      const deadline = performance.now() + milliseconds;
      let cancel;
      const finish = error => {
        cancel?.(); this.__presentationWaits.delete(pending);
        error ? reject(error) : resolve();
      };
      const pending = {
        abort: () => finish(new Error('EXECUCAO_INTERROMPIDA')),
        schedule: () => {
          cancel?.();
          const target = this.__presentationWindow || this.canvas?.ownerDocument?.defaultView || globalThis;
          if (kind === 'frame' && target.requestAnimationFrame) {
            const id = target.requestAnimationFrame(() => finish());
            cancel = () => target.cancelAnimationFrame(id);
          } else {
            const id = target.setTimeout(() => finish(), Math.max(0, deadline - performance.now()));
            cancel = () => target.clearTimeout(id);
          }
        },
      };
      this.__presentationWaits.add(pending); pending.schedule();
    });
  },
};
