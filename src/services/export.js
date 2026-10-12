import { assetUrl } from './assets.js';
import { zipSync, strToU8 } from 'fflate';
import { transpilePortugol } from '../../runtime/index.js';
import { collectResources, resourcePatterns } from './resources.js';
import { repository, normalizePath } from './repository.js';
function base64(bytes) { let result = ''; for (let i = 0; i < bytes.length; i += 16384) result += String.fromCharCode(...bytes.subarray(i, i + 16384)); return btoa(result); }
const escapeHTML = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export async function prepareExport({ code, filename, example, entries, localFiles, volume }, progress = () => {}) {
  const compiled = transpilePortugol(code), title = filename.replace(/\.por$/i, '');
  const resources = collectResources(code, example, entries, localFiles);
  const required = new Set(resourcePatterns(code, true).filter(path => !path.includes('*')).map(normalizePath));
  for (const path of resourcePatterns(code, 'outputs')) { if (!path.includes('*')) required.delete(normalizePath(path)); }
  const missing = resources.filter(entry => entry.source === 'missing' && required.has(entry.path));
  if (missing.length) throw new Error('Adicione os recursos ausentes antes de exportar: ' + missing.map(entry => entry.path).join(', '));
  const assets = []; let size = 0;
  const patterns = resourcePatterns(code).map(value => {
    try { return normalizePath(value); } catch { return null; }
  }).filter(Boolean).map(pattern => new RegExp('^' + pattern.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$'));
  // Pastas de exemplos podem conter recursos de vários jogos: inclui somente
  // caminhos referenciados, inclusive os padrões calculados, e arquivos da aba.
  const available = [...(example?.recursos || []), ...entries.map(entry => entry.path)];
  const paths = new Set([...Object.keys(localFiles), ...available.filter(path => patterns.some(pattern => pattern.test(path)))]);
  for (const rawPath of paths) {
    const path = normalizePath(rawPath); progress('Incluindo ' + path);
    let blob = localFiles[path];
    if (!blob && entries.some(entry => entry.path === path)) blob = await repository.read(path);
    if (!blob) {
      const base = example ? assetUrl('exemplos/' + example.caminho.slice(0, example.caminho.lastIndexOf('/') + 1)) : '';
      const response = await fetch(base + path.split('/').map(encodeURIComponent).join('/'));
      if (!response.ok) throw new Error('Não foi possível incluir o recurso: ' + path);
      blob = await response.blob();
    }
    size += blob.size;
    if (size > 128 * 1024 * 1024) throw new Error('O projeto ultrapassa 128 MB de recursos. Reduza o tamanho das imagens ou dos áudios usados no programa.');
    assets.push({ path, type: blob.type, data: base64(new Uint8Array(await blob.arrayBuffer())) });
  }
  progress('Preparando runtime');
  const response = await fetch(assetUrl('runtime/portugol.js')); if (!response.ok) throw new Error('Não foi possível carregar o runtime para exportação.');
  const bundle = base64(new TextEncoder().encode(await response.text()));
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code + JSON.stringify(assets)));
  const id = [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 24);
  const payload = JSON.stringify({ id, title, compiled, assets }).replaceAll('<', '\\u003c');
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(title)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#1e1e1e;color:#dfe1e5;font:14px system-ui}header{display:flex;align-items:center;gap:12px;padding:12px 18px;background:#181818;flex-wrap:wrap}h1{font-size:16px;margin:0;margin-right:auto}button{background:#ffc200;color:#121e24;border:0;border-radius:5px;padding:8px 12px;cursor:pointer}button:disabled{opacity:.5}main{padding:16px;display:grid;gap:16px}canvas{max-width:100%;height:auto;display:block;margin:auto;background:#000}#terminal{white-space:pre-wrap;overflow:auto;max-height:40vh;padding:12px;background:#151515;font:13px/1.6 monospace}#terminal input{background:#181818;color:white;border:1px solid #43454a;padding:8px}#status{padding:10px 18px;color:#9da0a8;font-size:12px}#files{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}#files button{background:#181818;font-size:11px}summary{cursor:pointer}label{display:flex;align-items:center;gap:8px;font-size:12px}input[type=range]{width:90px}
</style><header><h1>${escapeHTML(title)}</h1><button id="run">Executar</button><button id="stop" disabled>Parar</button><label>Volume <input id="volume" aria-label="Volume" type="range" min="0" max="100" value="${Number(volume) || 0}"></label></header><main><canvas id="screen" width="800" height="600" tabindex="0" aria-label="Tela gráfica"></canvas><div id="terminal" aria-label="Console"></div><details><summary>Arquivos do projeto · clique para baixar</summary><div id="files"></div></details></main><div id="status">Pronto · clique em Executar para iniciar</div><script id="project" type="application/json">${payload}</script><script src="data:text/javascript;base64,${bundle}"></script><script>PortugolWeb.mountProject(JSON.parse(document.getElementById('project').textContent)).catch(error=>{console.error(error);document.getElementById('status').textContent=error.message;});</script></html>`;
  return { html, title, count: assets.length, size, filename: (title.replace(/[^\p{L}\p{N}_-]/gu, '_') || 'programa') };
}
export function desktopSource(project) {
  const pkg = { name: 'portugol-project', version: '1.0.0', description: project.title, main: 'main.cjs', scripts: { start: 'electron .', 'build:win': 'electron-builder --win portable --x64' }, devDependencies: { electron: '^44.7.0', 'electron-builder': '^26.15.3' }, build: { appId: 'br.portugol.exported', productName: project.title, files: ['main.cjs', 'index.html'], win: { target: 'portable', signAndEditExecutable: false } } };
  return new Blob([zipSync({ 'index.html': strToU8(project.html), 'main.cjs': strToU8(desktopMain), 'package.json': strToU8(JSON.stringify(pkg, null, 2)), 'LEIA-ME.txt': strToU8('Projeto exportado do Portugol Studio.\nInstale Node.js, abra esta pasta no terminal e execute:\nnpm install\nnpm start\nPara gerar um executável Windows portátil:\nnpm run build:win\nO arquivo estará na pasta dist.\n') })], { type: 'application/zip' });
}
export const desktopMain = `const {app,BrowserWindow,session}=require('electron');
app.whenReady().then(()=>{session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));const window=new BrowserWindow({width:1100,height:800,autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',event=>event.preventDefault());window.loadFile('index.html');});app.on('window-all-closed',()=>app.quit());`;

