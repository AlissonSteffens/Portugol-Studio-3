import { readFile, writeFile } from 'node:fs/promises';
import { transpilePortugol } from '../core/transpilation/transpiler.js';
import { PortugolRuntime } from '../runtime/runtime.js';
import { ExecutionDebugger } from '../core/execution/debugger.js';
import { analyzeCode } from '../ide/src/services/analysis.js';

// Fixed simulated input/time, no display refresh wait: measure execution cost,
// not the monitor's refresh rate. Run before and after with the same frame count.
const frames = Number(process.env.BENCHMARK_FRAMES || 12), results = [];
for (const name of ['2d', '3d']) {
  const code = await readFile(`public/exemplos/web/blocos_${name}.por`, 'utf8');
  const analysis = analyzeCode(code), runtime = new PortugolRuntime(null, null, { inspectionInterval: 80 });
  for (const method of ['save', 'restore', 'translate', 'rotate', 'resetTransform']) runtime.__rawBCtx[method] ||= () => {};
  const counters = { frames: 0, inspections: 0, libraryCalls: 0, interrupts: 0 }, values = {};
  runtime.debugger = new ExecutionDebugger({ lineAt: from => code.slice(0, from).split('\n').length }); runtime.debugger.mode = 'continue';
  runtime.inspect = (scope, from, symbols) => {
    counters.inspections++; runtime.debugger.inspect(scope, from, symbols);
    for (const symbol of symbols) {
      const owner = analysis.symbols.some(item => item.kind === 'variable' && item.from === symbol.from) ? 'programa' : scope;
      values[`${owner}:${symbol.from}`] = symbol.value;
    }
  };
  runtime.__keyStates.set(87, true);
  runtime.Util.tempo_decorrido = () => counters.frames * 16;
  runtime.waitForFrame = () => { counters.frames++; if (counters.frames >= frames) runtime.abort(); return Promise.resolve(); };
  const call = (runtime.callLibrarySync || runtime.callLibrary).bind(runtime), interrupt = runtime.checkInterrupt.bind(runtime);
  runtime.callLibrarySync = (...args) => { counters.libraryCalls++; return call(...args); };
  runtime.checkInterrupt = () => { counters.interrupts++; return interrupt(); };
  const compiled = transpilePortugol(code, { inspect: true, debug: true });
  const started = performance.now();
  try { await new Function('__runtime', compiled)(runtime); }
  catch (error) { if (error.message !== 'EXECUCAO_INTERROMPIDA') throw error; }
  finally { runtime.destroy(); }
  results.push({ example: name, milliseconds: Math.round(performance.now() - started), ...counters });
}
const output = JSON.stringify(results, null, 2); console.log(output);
if (process.argv[2]) await writeFile(process.argv[2], output + '\n');
