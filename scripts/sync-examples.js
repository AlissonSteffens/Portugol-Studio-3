import { readdir, readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { repairExample } from './example-fixes.js';
const source = path.resolve('../ide/src/main/assets/exemplos');
const destination = path.resolve('public/exemplos');
export function decodeSource(bytes) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return new TextDecoder('windows-1252').decode(bytes); }
}
async function walk(directory) {
  return (await Promise.all((await readdir(directory, { withFileTypes: true })).map(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}
const descriptions = new Map(), categories = new Map();
const files = await walk(source);
for (const file of files.filter(file => file.endsWith('index.properties'))) {
  const properties = Object.fromEntries(decodeSource(await readFile(file)).split(/\r?\n/).filter(line => line.includes('=')).map(line => { const index = line.indexOf('='); return [line.slice(0, index).trim(), line.slice(index + 1).trim()]; }));
  for (const key of Object.keys(properties).filter(key => /^item\d+\.type$/.test(key))) {
    const prefix = key.slice(0, -5), directory = path.dirname(file);
    if (properties[key] === 'dir') categories.set(path.join(directory, properties[prefix + '.dir']), properties[prefix + '.name']);
    else descriptions.set(path.join(directory, properties[prefix + '.file']), { nome: properties[prefix + '.name'], descricao: properties[prefix + '.description'] || '', imagem: properties[prefix + '.image'] ? path.relative(source, path.join(directory, properties[prefix + '.image'])).replaceAll('\\', '/') : null });
  }
}
const examples = [];
for (const file of files) {
  if (file.endsWith('.properties')) continue;
  const relative = path.relative(source, file).replaceAll('\\', '/');
  const target = path.join(destination, relative);
  await mkdir(path.dirname(target), { recursive: true }); await copyFile(file, target);
  if (!file.endsWith('.por')) continue;
  const repaired = repairExample(relative, decodeSource(await readFile(file)));
  if (repaired.ajustes.length) await writeFile(target, repaired.source, 'utf8');
  const parts = relative.split('/').slice(0, -1);
  const category = parts.map((_, i) => categories.get(path.join(source, ...parts.slice(0, i + 1)))).filter(Boolean).join(' / ');
  const directory = path.dirname(file);
  const resources = files.filter(resource => resource.startsWith(directory + path.sep) && !['.por', '.properties'].includes(path.extname(resource))).map(resource => path.relative(directory, resource).replaceAll('\\', '/'));
  examples.push({ id: relative.slice(0, -4).replaceAll('/', '_'), ...descriptions.get(file), nome: descriptions.get(file)?.nome || path.basename(file, '.por'), categoria: category || 'Outros', arquivo: path.basename(file), caminho: relative, recursos: resources, ajustes: repaired.ajustes });
}
examples.sort((a, b) => a.categoria.localeCompare(b.categoria, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'));
await writeFile(path.join(destination, 'index.json'), JSON.stringify(examples, null, 2) + '\n');
console.log(`${examples.length} exemplos e ${files.filter(file => !file.endsWith('.properties') && !file.endsWith('.por')).length} recursos sincronizados de ${source}.`);
