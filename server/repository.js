import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

export function normalizePath(value) {
  const name = String(value ?? '').replaceAll('\\', '/').replace(/^(\.\/)+/, '');
  if (!name || name.startsWith('/') || /^[a-z]:/i.test(name) || name.split('/').some(p => !p || p === '..' || p === '.') || /[\x00-\x1f]/.test(name) || name.length > 512) {
    throw Object.assign(new Error('Caminho inválido. Use um caminho relativo, como imagens/fundo.png.'), { status: 400 });
  }
  return name;
}

export function createRepositoryHandler(directory = process.env.PORTUGOL_DATA_DIR || path.resolve('.data/files')) {
  // Os nomes fornecidos pelo aluno nunca são usados como caminhos no disco.
  const objectPath = name => path.join(directory, createHash('sha256').update(name).digest('hex') + '.json');
  let queue = Promise.resolve();
  async function atomicWrite(name, data) {
    const target = objectPath(name), temp = target + '.' + randomUUID() + '.tmp';
    try { await writeFile(temp, JSON.stringify(data)); await rename(temp, target); }
    finally { await rm(temp, { force: true }); }
  }
  async function handle(req, res) {
    try {
      await mkdir(directory, { recursive: true });
      const url = new URL(req.url, 'http://localhost');
      const name = url.searchParams.has('path') ? normalizePath(url.searchParams.get('path')) : null;
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (url.pathname !== '/api/files') throw Object.assign(new Error('Rota não encontrada.'), { status: 404 });
      if (req.method === 'GET' && !name) {
        const items = [];
        for (const entry of await readdir(directory)) {
          if (!entry.endsWith('.json')) continue;
          const item = JSON.parse(await readFile(path.join(directory, entry), 'utf8'));
          items.push({ path: item.path, type: item.type, size: Buffer.from(item.data, 'base64').length, updatedAt: item.updatedAt });
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(items.sort((a, b) => a.path.localeCompare(b.path))));
      } else if (req.method === 'GET' && name) {
        const item = JSON.parse(await readFile(objectPath(name), 'utf8'));
        // HTML/SVG nunca são executados na origem da aplicação.
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(name.split('/').pop()));
        res.end(Buffer.from(item.data, 'base64'));
      } else if (req.method === 'PUT' && name) {
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 20 * 1024 * 1024) throw Object.assign(new Error('O limite por arquivo é 20 MB.'), { status: 413 });
          chunks.push(chunk);
        }
        await atomicWrite(name, { path: name, type: req.headers['content-type'] || 'application/octet-stream', data: Buffer.concat(chunks).toString('base64'), updatedAt: new Date().toISOString() });
        res.statusCode = 204; res.end();
      } else if (req.method === 'DELETE' && name) {
        await rm(objectPath(name), { force: true }); res.statusCode = 204; res.end();
      } else throw Object.assign(new Error('Método ou caminho inválido.'), { status: 400 });
    } catch (error) {
      if (error.code !== 'ENOENT') console.error(error);
      res.statusCode = error.status || (error.code === 'ENOENT' ? 404 : 500);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.code === 'ENOENT' ? 'Arquivo não encontrado.' : error.status ? error.message : 'Não foi possível acessar o repositório.' }));
    }
  }
  return (req, res) => { queue = queue.then(() => handle(req, res)); return queue; };
}
