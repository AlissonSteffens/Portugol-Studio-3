import contracts, { libraryConstants } from '../../js/library-contracts.js';

const parameterType = parameter => parameter.type + '[]'.repeat(parameter.dimensions || 0);

export const libraryTopics = Object.entries(contracts).flatMap(([library, functions]) => {
  const members = Object.entries(functions).filter(([, contract]) => contract.description || contract.available);
  const constants = Object.entries(libraryConstants[library] || {});
  return [
    { title: library, group: 'Bibliotecas', path: 'library:' + library, library, search: members.map(([name, contract]) => name + ' ' + contract.description).join(' ') },
    ...members.map(([member, contract]) => ({ title: library + '.' + member, group: 'Funções de ' + library, path: 'library:' + library + ':' + member, library, member, search: contract.description + ' ' + contract.parameters.map(parameter => parameter.name + ' ' + parameter.description).join(' ') })),
    ...constants.map(([member, contract]) => ({ title: library + '.' + member, group: 'Constantes de ' + library, path: 'constant:' + library + ':' + member, library, member, constant: true, search: contract.description })),
  ];
});

export default function LibraryHelp({ topic }) {
  const functions = Object.entries(contracts[topic.library]).filter(([name, contract]) => (contract.description || contract.available) && (!topic.member || !topic.constant && topic.member === name));
  const constants = Object.entries(libraryConstants[topic.library] || {}).filter(([name]) => !topic.member || topic.constant && topic.member === name);
  return <article className="library-docs">
    <h1>Biblioteca {topic.library}</h1>
    {topic.library === 'Internet' && <p>As requisições são feitas diretamente pelo navegador. O site consultado precisa permitir esse acesso (CORS); a IDE não utiliza um proxy. Em páginas HTTPS, endereços HTTP podem ser bloqueados pelo navegador.</p>}
    {topic.library === 'Navegador' && <p>Biblioteca exclusiva da versão Web. Consulta o ambiente da janela de execução, inclusive no HTML exportado. A identificação de dispositivo, navegador e sistema é aproximada; prefira consultar suporte a toque e mouse para adaptar controles. Leia também o guia “Ambiente do navegador” na ajuda, com um exemplo que pode ser aberto no editor.</p>}
    <pre><code>inclua biblioteca {topic.library}</code></pre>
    {functions.map(([name, contract]) => <section key={name} className="library-function">
      <h2>{name}</h2>
      <pre><code>{contract.type} {name}({contract.parameters.map(parameter => parameterType(parameter) + ' ' + parameter.name).join(', ')})</code></pre>
      {!contract.available && <p className="library-unavailable">Documentada na versão Java; indisponível nesta versão Web.</p>}
      {contract.description && <p>{contract.description}</p>}
      <h3>Parâmetros</h3>
      {contract.parameters.length ? <dl>{contract.parameters.map(parameter => <div key={parameter.name}><dt><code>{parameter.name}</code> · {parameterType(parameter)}</dt><dd>{parameter.description || 'Valor do tipo ' + parameterType(parameter) + '.'}</dd></div>)}</dl> : <p>Não recebe parâmetros.</p>}
      <h3>Retorno · {contract.type}</h3>
      <p>{contract.returns || (contract.type === 'vazio' ? 'Não retorna um valor.' : 'Valor do tipo ' + contract.type + '.')}</p>
    </section>)}
    {constants.length > 0 && <section><h2>Constantes</h2><dl>{constants.map(([name, contract]) => <div key={name}><dt><code>{contract.type} {name}</code></dt><dd>{contract.description || 'Constante da biblioteca ' + topic.library + '.'}</dd></div>)}</dl></section>}
  </article>;
}
