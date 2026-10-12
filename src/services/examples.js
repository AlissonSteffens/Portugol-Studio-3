export function decodeSource(bytes) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return new TextDecoder('windows-1252').decode(bytes); }
}
export async function loadCatalog() {
  const response = await fetch('/exemplos/index.json');
  if (!response.ok) throw new Error('Não foi possível carregar o catálogo de exemplos.');
  return response.json();
}
export async function loadExample(example) {
  const response = await fetch('/exemplos/' + example.caminho.split('/').map(encodeURIComponent).join('/'));
  if (!response.ok) throw new Error('Não foi possível abrir o exemplo: ' + example.nome);
  return decodeSource(await response.arrayBuffer()).replaceAll('\r\n', '\n');
}
