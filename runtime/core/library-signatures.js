import contracts from './library-contracts.js';

// Parâmetros opcionais já oferecidos pelo runtime web. As assinaturas Java
// permanecem no catálogo; estas extensões não podem quebrar programas existentes.
const minimumParameters = {
  'Graficos.iniciar_modo_grafico': 0,
  'Graficos.redimensionar_imagem': 3,
  'Graficos.transformar_imagem': 4,
  'Tipos.cadeia_e_inteiro': 1,
  'Tipos.cadeia_para_inteiro': 1,
  'Sons.reproduzir_som': 1,
};

export function librarySignature(library, name) {
  const signature = contracts[library]?.[name];
  if (!signature) return;
  const parameters = signature.parameters.map(parameter => ({ ...parameter, type: parameter.type === 'vazio' && parameter.dimensions ? 'todos' : parameter.type }));
  const minimum = minimumParameters[`${library}.${name}`] ?? parameters.length;
  if (library === 'Graficos' && name === 'criar_cor') parameters.push({ type: 'inteiro', dimensions: 0, name: 'alfa' });
  return { ...signature, parameters, minimum };
}
