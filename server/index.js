import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createRepositoryHandler } from './repository.js';
import { internetHandler } from './internet.js';
import { executableHandler } from './export.js';
const repository = createRepositoryHandler();
const root = path.resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.por': 'text/plain', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ttf': 'font/ttf' };
http.createServer(async (req, res) => {
  if (req.url === '/api/export/executable') return executableHandler(req, res);
  if (req.url.startsWith('/api/files')) return repository(req, res);
  if (req.url.startsWith('/api/internet?')) return internetHandler(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    const data = await readFile(target);
    res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404); res.end('Página não encontrada. Execute npm run build antes de iniciar.'); }
}).listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log('Portugol Studio disponível na porta ' + (process.env.PORT || 3000)));
