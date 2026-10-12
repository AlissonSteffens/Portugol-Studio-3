import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
function publicAddress(address) {
  if (address.includes(':')) return !/^(::|fc|fd|fe|ff)/i.test(address);
  const [a, b] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 || a >= 224);
}
async function retrieve(url, timeout, redirects = 0) {
  const target = new URL(url);
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.port && !['80', '443'].includes(target.port)) throw new Error('Use um endereço HTTP/HTTPS público.');
  const addresses = await lookup(target.hostname, { all: true });
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new Error('Endereços de redes locais não são permitidos pela biblioteca Internet.');
  const address = addresses[0];
  return new Promise((resolve, reject) => {
    const request = (target.protocol === 'https:' ? https : http).get(target, {
      autoSelectFamily: false,
      lookup: (_, __, callback) => callback(null, address.address, address.family),
      headers: { 'User-Agent': 'Portugol-Studio-Web/0.2', Accept: '*/*' },
    }, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        if (redirects >= 3) return reject(new Error('Excesso de redirecionamentos.'));
        retrieve(new URL(response.headers.location, target).href, timeout, redirects + 1).then(resolve, reject); return;
      }
      const chunks = []; let size = 0;
      response.on('data', chunk => { size += chunk.length; if (size > 20 * 1024 * 1024) request.destroy(new Error('Conteúdo remoto excede 20 MB.')); else chunks.push(chunk); });
      response.on('end', () => resolve({ status: response.statusCode, type: response.headers['content-type'] || 'application/octet-stream', body: Buffer.concat(chunks) }));
      response.on('error', reject);
    });
    request.setTimeout(timeout, () => request.destroy(new Error('Tempo limite ao acessar o endereço.')));
    request.on('error', reject);
  });
}
export async function internetHandler(req, res) {
  if (req.method !== 'GET') { res.writeHead(405); return res.end(); }
  try {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const response = await retrieve(params.get('url'), Math.min(30000, Math.max(1, Number(params.get('timeout')) || 10000)));
    res.setHeader('Content-Type', response.type);
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.writeHead(response.status); res.end(response.body);
  } catch (error) { console.error(error); res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Não foi possível obter o conteúdo remoto: ' + error.message })); }
}
