import { build } from 'esbuild';
export async function runtimeBundle() {
  const result = await build({ entryPoints: ['runtime/index.js'], bundle: true, write: false, format: 'iife', globalName: 'PortugolWeb', platform: 'browser', target: 'es2022', minify: true });
  return result.outputFiles[0].text;
}
export function runtimePlugin() {
  return {
    name: 'runtime-independente',
    configureServer(server) { server.middlewares.use(async (req, res, next) => { if (req.url?.split('?')[0] !== server.config.base + 'runtime/portugol.js') return next(); try { res.setHeader('Content-Type', 'text/javascript'); res.end(await runtimeBundle()); } catch (error) { next(error); } }); },
    async generateBundle() { this.emitFile({ type: 'asset', fileName: 'runtime/portugol.js', source: await runtimeBundle() }); },
  };
}
