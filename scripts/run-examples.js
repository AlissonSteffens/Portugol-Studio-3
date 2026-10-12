import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const baseURL = process.env.PORTUGOL_URL || 'http://127.0.0.1:5173';
const examples = JSON.parse(await readFile('public/exemplos/index.json', 'utf8'));
const selected = process.env.EXAMPLES_FILTER ? examples.filter(example => example.caminho.includes(process.env.EXAMPLES_FILTER)) : examples;
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
// As gravações de exemplos destrutivos ficam isoladas; nenhum arquivo do usuário é alterado.
let storage = new Map();
await page.route('**/api/files*', async route => {
  const request = route.request(), name = new URL(request.url()).searchParams.get('path');
  if (request.method() === 'GET' && !name) return route.fulfill({ json: [...storage].map(([path, content]) => ({ path, type: 'text/plain', size: content.length })) });
  if (request.method() === 'GET') return route.fulfill({ body: storage.get(name) || '' });
  if (request.method() === 'PUT') storage.set(name, request.postDataBuffer());
  if (request.method() === 'DELETE') storage.delete(name);
  await route.fulfill({ status: 204 });
});
await page.goto(baseURL);
const results = [];
for (const example of selected) {
  storage = new Map();
  const result = await page.evaluate(async example => {
    const [{ transpilePortugol, tokenize }, { PortugolRuntime }, { createRuntimeFiles }, { loadExample }] = await Promise.all([import('/js/transpiler.js'), import('/js/runtime.js'), import('/src/services/repository.js'), import('/src/services/examples.js')]);
    const source = await loadExample(example), canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 600;
    const files = await createRuntimeFiles(() => {}, console.error, example);
    const runtime = new PortugolRuntime(canvas, null, { files, stepLimit: 50000 });
    const output = []; let reads = 0, renders = 0, writes = 0;
    runtime.escreva = async (...args) => { output.push(args.map(arg => runtime.stringify(arg)).join('')); if (output.length > 2000) runtime.abort(); };
    runtime.leia = async type => { reads++; if (reads > 25) { runtime.abort(); throw new Error('EXECUCAO_INTERROMPIDA'); } return type === 'cadeia' ? 'teste' : type === 'caracter' ? 's' : type === 'logico' ? false : [2, 3, 1, 10, 0][(reads - 1) % 5]; };
    runtime.Arquivos.selecionar_arquivo = () => Object.keys(files.files).find(path => /\.txt$/.test(path)) || 'dummyText.txt';
    const render = runtime.Graficos.renderizar; runtime.Graficos.renderizar = async () => { renders++; return render(); };
    const write = files.write; files.write = (...args) => { writes++; return write(...args); };
    const aliases = Object.fromEntries(Object.keys(runtime).filter(key => /^[A-Z]/.test(key)).map(key => [key, key]));
    const tokens = tokenize(source).filter(token => !['whitespace', 'comment'].includes(token.type));
    for (let i = 0; i < tokens.length; i++) if (tokens[i].value === 'biblioteca') aliases[tokens[i + 2]?.value === '-->' ? tokens[i + 3].value : tokens[i + 1].value] = tokens[i + 1].value;
    const missing = new Set();
    for (let i = 0; i < tokens.length - 2; i++) if (aliases[tokens[i].value] && tokens[i + 1].value === '.' && !(tokens[i + 2].value in runtime[aliases[tokens[i].value]])) missing.add(aliases[tokens[i].value] + '.' + tokens[i + 2].value);
    let status = 'concluido', error;
    const started = performance.now(), timer = setTimeout(() => runtime.abort(), example.caminho.endsWith('robos.por') ? 10000 : 2500);
    const keyTimers = [];
    let keyStage = 0;
    const inputTimer = setInterval(() => {
      const code = ['KeyA', 'Enter', 'Digit1', 'Space'][keyStage++ % 4];
      runtime._onKeyDown({ code, preventDefault() {} });
      keyTimers.push(setTimeout(() => runtime._onKeyUp({ code }), 60));
      runtime.__mouseX = 100; runtime.__mouseY = 100;
    }, 400);
    try { if (missing.size) throw new Error('APIs ausentes: ' + [...missing].join(', ')); await new Function('__runtime', transpilePortugol(source))(runtime); if (runtime.__aborted) status = 'interrompido-por-limite'; }
    catch (failure) { error = failure.message; status = ['EXECUCAO_INTERROMPIDA', 'Limite de instruções excedido.'].includes(error) ? 'interrompido-por-limite' : 'erro'; }
    finally { clearTimeout(timer); clearInterval(inputTimer); for (const timer of keyTimers) clearTimeout(timer); runtime.destroy(); await files.flush(); }
    return { caminho: example.caminho, status, error, leituras: reads, quadros: renders, escritas: writes, duracaoMs: Math.round(performance.now() - started), saida: output.join('').slice(-1000) };
  }, example).catch(error => ({ caminho: example.caminho, status: 'erro', error: error.message }));
  results.push(result); console.log(`${results.length}/${examples.length} ${result.status}: ${example.caminho}${result.status === 'erro' ? ' — ' + result.error : ''}`);
}
await browser.close();
await mkdir('reports', { recursive: true }); await writeFile('reports/examples.json', JSON.stringify(results, null, 2));
const totals = results.reduce((totals, result) => ({ ...totals, [result.status]: (totals[result.status] || 0) + 1 }), {});
console.log(JSON.stringify(totals));
if (totals.erro) process.exitCode = 1;
