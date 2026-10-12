import { mkdtemp, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let building = false;
function toolsAvailable() {
  try { require.resolve('electron-builder/cli.js'); return existsSync(path.join(path.dirname(require.resolve('electron/package.json')), 'dist', 'electron.exe')); }
  catch { return false; }
}
export async function executableHandler(req, res) {
  const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  if (req.method === 'GET') return json(200, { available: process.platform === 'win32' && local && toolsAvailable(), platform: process.platform });
  if (req.method !== 'POST') return json(405, { error: 'Método não permitido.' });
  if (process.platform !== 'win32') return json(400, { error: 'A geração direta do .exe requer a IDE em um servidor Windows. Use o pacote Electron para compilar no seu computador.' });
  if (!local) return json(403, { error: 'A geração de executáveis está disponível apenas na IDE local.' });
  try { if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return json(403, { error: 'Origem da solicitação inválida.' }); }
  catch { return json(403, { error: 'Origem da solicitação inválida.' }); }
  if (!toolsAvailable()) return json(400, { error: 'Instale as dependências de desenvolvimento da IDE para gerar executáveis.' });
  if (building) return json(409, { error: 'Outro executável está sendo gerado. Aguarde e tente novamente.' });
  let directory;
  building = true;
  try {
    let size = 0; const chunks = [];
    for await (const chunk of req) { size += chunk.length; if (size > 200 * 1024 * 1024) return json(413, { error: 'Projeto excede o limite da exportação.' }); chunks.push(chunk); }
    const payload = JSON.parse(Buffer.concat(chunks).toString());
    if (typeof payload.html !== 'string' || !payload.html.startsWith('<!doctype html>')) return json(400, { error: 'Projeto HTML inválido.' });
    directory = await mkdtemp(path.join(tmpdir(), 'portugol-export-'));
    const electronVersion = require('electron/package.json').version;
    const pkg = { name: 'portugol-project', version: '1.0.0', description: String(payload.title || 'Programa Portugol'), main: 'main.cjs', author: 'Portugol Studio', build: { appId: 'br.portugol.exported', productName: 'Programa Portugol', compression: 'store', electronVersion, directories: { output: 'release' }, files: ['index.html', 'main.cjs'], win: { target: 'portable', signAndEditExecutable: false }, artifactName: 'programa.exe' } };
    const main = await readFile(new URL('../desktop/main.cjs', import.meta.url));
    await Promise.all([writeFile(path.join(directory, 'index.html'), payload.html), writeFile(path.join(directory, 'main.cjs'), main), writeFile(path.join(directory, 'package.json'), JSON.stringify(pkg))]);
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [require.resolve('electron-builder/cli.js'), '--win', 'portable', '--x64', '--projectDir', directory], { windowsHide: true, env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' } });
      let logs = ''; const capture = chunk => { logs = (logs + chunk.toString()).slice(-12000); };
      child.stdout.on('data', capture); child.stderr.on('data', capture);
      const timer = setTimeout(() => { child.kill(); }, 10 * 60 * 1000);
      child.on('error', error => { clearTimeout(timer); reject(error); });
      child.on('exit', code => { clearTimeout(timer); if (code === 0) resolve(); else { console.error('Falha ao empacotar Electron:', logs); reject(new Error('Falha ao gerar o executável. Consulte o console do servidor ou exporte o pacote Electron.')); } });
    });
    const executable = path.join(directory, 'release', 'programa.exe');
    res.writeHead(200, { 'Content-Type': 'application/vnd.microsoft.portable-executable', 'Content-Disposition': 'attachment; filename="programa.exe"', 'Content-Length': (await stat(executable)).size });
    await pipeline(createReadStream(executable), res);
  } catch (error) { console.error(error); if (!res.headersSent) json(500, { error: error.message }); }
  finally { building = false; if (directory) await rm(directory, { recursive: true, force: true }); }
}

