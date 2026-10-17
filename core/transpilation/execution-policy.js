// Only audited synchronous APIs enter the fast path. I/O, media and unknown
// methods retain their async path and Portuguese error translation.
const synchronousLibraries = new Set(['Matematica', 'Tipos', 'Texto', 'Mouse', 'Calendario', 'Objetos']);
const synchronousGraphics = new Set([
  'iniciar_modo_grafico', 'encerrar_modo_grafico', 'definir_dimensoes_janela', 'definir_titulo_janela',
  'criar_cor', 'definir_cor', 'limpar', 'desenhar_retangulo', 'desenhar_elipse', 'desenhar_linha',
  'desenhar_ponto', 'desenhar_poligono', 'desenhar_texto', 'desenhar_imagem', 'desenhar_porcao_imagem',
  'definir_tamanho_texto', 'definir_fonte_texto', 'definir_estilo_texto', 'definir_opacidade', 'definir_rotacao',
  'largura_janela', 'altura_janela', 'largura_tela', 'altura_tela', 'obter_largura_imagem', 'obter_altura_imagem',
  'renderizar_imagem', 'liberar_imagem', 'criar_buffer', 'usar_buffer', 'desenhar_buffer', 'limpar_buffer', 'liberar_buffer',
]);
export function isSynchronousLibraryCall(library, name) {
  return synchronousLibraries.has(library) || library === 'Graficos' && synchronousGraphics.has(name)
    || library === 'Teclado' && ['tecla_pressionada', 'alguma_tecla_pressionada', 'caracter_tecla'].includes(name)
    || library === 'Util' && ['tempo_decorrido', 'sorteia', 'numero_elementos', 'obter_diretorio_usuario', 'obter_diretorio_programa'].includes(name);
}

export function synchronousFunctions(program) {
  const functions = new Map(program.functions.map(fn => [fn.name, fn])), result = new Map();
  function eligible(name, visiting = new Set()) {
    if (result.has(name)) return result.get(name);
    if (visiting.has(name)) return false; // Recursion must keep yielding.
    const next = new Set(visiting).add(name);
    function visit(node) {
      if (!node || typeof node !== 'object') return true;
      if (['for', 'while', 'do'].includes(node.kind)) return false;
      if (node.kind === 'call') {
        if (node.target.kind === 'name') {
          if (node.target.name !== 'sorteia' && (!functions.has(node.target.name) || !eligible(node.target.name, next))) return false;
        } else if (!isSynchronousLibraryCall(program.libraries[node.target.object?.name], node.target.name)) return false;
      }
      return Object.values(node).every(value => Array.isArray(value) ? value.every(visit) : !value || typeof value !== 'object' || visit(value));
    }
    const value = visit(functions.get(name).body); result.set(name, value); return value;
  }
  for (const name of functions.keys()) eligible(name);
  return new Set([...result].filter(([, value]) => value).map(([name]) => name));
}
