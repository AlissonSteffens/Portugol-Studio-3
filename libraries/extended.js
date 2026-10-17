import { runtimeError } from '../core/diagnostics/index.js';

// Bibliotecas presentes no core Java que possuem mensagens próprias de erro.
export function installExtendedLibraries(runtime) {
  const fail = message => { throw runtimeError('ErroExecucaoBiblioteca', message); };
  const objects = new Map(), propertyTypes = new WeakMap();
  let nextObject = 0, connection;
  const store = value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('O valor informado não representa um objeto válido.');
    if (objects.size >= (runtime.options.maxObjects || 10000)) fail('O número máximo de objetos que podem ser criados ao mesmo tempo foi atingido.');
    const address = nextObject++; objects.set(address, value); return address;
  };
  const object = address => { if (!objects.has(address)) fail(`O endereço de memória (${address}) não aponta para um objeto válido.`); return objects.get(address); };
  const property = (address, name, index) => {
    const value = object(address);
    if (!Object.hasOwn(value, name)) fail(`A propriedade “${name}” não existe neste objeto.`);
    if (index === undefined) return value[name];
    if (!Array.isArray(value[name])) fail(`A propriedade “${name}” não é um vetor.`);
    if (!Number.isInteger(index) || index < 0 || index >= value[name].length) fail(`O índice [${index}] é inválido para a propriedade “${name}”. Os índices começam em 0 e devem ser menores que ${value[name].length}.`);
    return value[name][index];
  };
  const typed = (value, type, name) => {
    const valid = type === 'objeto' ? value && typeof value === 'object' && !Array.isArray(value) : type === 'cadeia' ? typeof value === 'string' : type === 'caracter' ? typeof value === 'string' && value.length === 1 : type === 'logico' ? typeof value === 'boolean' : typeof value === 'number' && Number.isFinite(value) && (type === 'real' || Number.isInteger(value));
    if (!valid) fail(`A propriedade “${name}” não contém um valor do tipo ${type}.`);
    return type === 'objeto' ? store(value) : value;
  };
  const o = runtime.Objetos = {
    TIPO_INTEIRO: 1, TIPO_CADEIA: 2, TIPO_CARACTER: 3, TIPO_REAL: 4, TIPO_LOGICO: 5, TIPO_OBJETO: 6, TIPO_VETOR: 7,
    criar_objeto: () => store(Object.create(null)),
    criar_objeto_via_json(json) { try { return store(JSON.parse(json, function (key, value, context) {
      if (typeof value === 'number') { let tags = propertyTypes.get(this); if (!tags) propertyTypes.set(this, tags = new Map()); tags.set(key, context?.source && /[.eE]/.test(context.source) ? 4 : Number.isInteger(value) ? 1 : 4); }
      return value;
    })); } catch (error) { if (error.code) throw error; fail('Não foi possível criar um objeto a partir do JSON informado. Verifique a sintaxe do JSON.'); } },
    criar_objeto_via_xml(xml) {
      if (typeof DOMParser === 'undefined') fail('O leitor XML não está disponível neste ambiente de execução.');
      const document = new DOMParser().parseFromString(xml, 'application/xml');
      if (document.querySelector('parsererror')) fail('Não foi possível criar um objeto a partir do XML informado. Verifique a sintaxe do XML.');
      const convert = element => {
        if (!element.children.length) return element.textContent;
        const result = Object.create(null);
        for (const child of element.children) {
          const value = convert(child);
          if (Object.hasOwn(result, child.tagName)) result[child.tagName] = Array.isArray(result[child.tagName]) ? [...result[child.tagName], value] : [result[child.tagName], value];
          else result[child.tagName] = value;
        }
        return result;
      };
      const value = convert(document.documentElement);
      return store(typeof value === 'object' ? value : { valor: value });
    },
    atribuir_propriedade(address, name, value) { Object.defineProperty(object(address), name, { value, writable: true, enumerable: true, configurable: true }); },
    obter_tamanho_vetor_propriedade(address, name) { const value = property(address, name); if (!Array.isArray(value)) fail(`A propriedade “${name}” não é um vetor.`); return value.length; },
    liberar_objeto(address) { object(address); objects.delete(address); },
    liberar() { objects.clear(); },
    obter_json(address) { try { return JSON.stringify(object(address)); } catch (error) { if (error.code) throw error; fail('Não foi possível obter o JSON deste objeto.'); } },
    contem_propriedade: (address, name) => Object.hasOwn(object(address), name),
    tipo_propriedade(address, name) {
      const value = property(address, name), tagged = propertyTypes.get(object(address))?.get(name);
      if (tagged) return tagged;
      if (Array.isArray(value)) return o.TIPO_VETOR;
      if (typeof value === 'number') return Number.isInteger(value) ? o.TIPO_INTEIRO : o.TIPO_REAL;
      if (typeof value === 'string') return o.TIPO_CADEIA;
      if (typeof value === 'boolean') return o.TIPO_LOGICO;
      if (value && typeof value === 'object') return o.TIPO_OBJETO;
      fail(`Não foi possível determinar o tipo da propriedade “${name}”.`);
    },
  };
  for (const type of ['inteiro', 'real', 'logico', 'caracter', 'cadeia', 'objeto']) {
    o['obter_propriedade_tipo_' + type] = (address, name) => {
      const value = property(address, name), tag = propertyTypes.get(object(address))?.get(name), expected = ({ inteiro: 1, cadeia: 2, caracter: 3, real: 4, logico: 5, objeto: 6 })[type];
      if ((tag && tag !== expected) || (type === 'caracter' && tag !== 3)) fail(`A propriedade “${name}” não contém um valor do tipo ${type}.`);
      return typed(value, type, name);
    };
    o['obter_propriedade_tipo_' + type + '_em_vetor'] = (address, name, index) => typed(property(address, name, index), type, name);
  }
  // Permite distinguir caracter de cadeia e real de inteiro, que compartilham
  // a representação JavaScript; o compilador informa o tipo do terceiro argumento.
  runtime.tagObjectProperty = (address, name, type) => {
    const value = object(address);
    let tags = propertyTypes.get(value); if (!tags) propertyTypes.set(value, tags = new Map());
    tags.set(name, ({ inteiro: 1, cadeia: 2, caracter: 3, real: 4, logico: 5 })[type]);
  };

  runtime.__serviceRequests = new Set();
  const url = address => { try { const value = new URL(address); if (!['http:', 'https:'].includes(value.protocol)) fail('Utilize um endereço HTTP ou HTTPS válido.'); return value.href; } catch (error) { if (error.code) throw error; fail('O endereço informado para o serviço web é inválido.'); } };
  const cached = () => { if (!connection) fail('É necessário criar uma conexão customizada antes de adicionar cabeçalhos ou parâmetros.'); return connection; };
  async function request(address, method, body, headers = {}) {
    if (runtime.__aborted) throw new Error('EXECUCAO_INTERROMPIDA');
    const controller = new AbortController(); runtime.__serviceRequests.add(controller);
    try {
      const response = await fetch(url(address), { method, headers, body: ['GET', 'HEAD'].includes(method) ? undefined : body, signal: controller.signal });
      if (!response.ok) fail(`Ocorreu um problema na requisição. O serviço respondeu com HTTP ${response.status}.`);
      return await response.text();
    } catch (error) {
      if (runtime.__aborted) throw new Error('EXECUCAO_INTERROMPIDA');
      if (error.code) throw error;
      fail('Ocorreu um problema na requisição. Verifique o endereço, a conexão e se o serviço permite acesso pelo navegador (CORS).');
    } finally { runtime.__serviceRequests.delete(controller); }
  }
  runtime.ServicosWeb = {
    OBTER: 1, PUBLICAR: 2, ATUALIZAR: 3, EXCLUIR: 4,
    obter_dados: address => request(address, 'GET'),
    excluir_dados: address => request(address, 'DELETE'),
    publicar_dados: (address, body) => request(address, 'POST', body, { 'Content-Type': 'application/json' }),
    atualizar_dados: (address, body) => request(address, 'PUT', body, { 'Content-Type': 'application/json' }),
    abrir_conexao(address) { connection = { address: url(address), headers: {}, body: undefined }; },
    adicionar_cabecalho(key, value) { const item = cached(); try { const headers = new Headers(item.headers); headers.set(key, value); item.headers = Object.fromEntries(headers); } catch { fail('O nome ou valor do cabeçalho informado é inválido.'); } },
    adicionar_parametros(body) { cached().body = body; },
    fazer_requisicao(method) { const item = cached(), verb = ({ 1: 'GET', 2: 'POST', 3: 'PUT', 4: 'DELETE' })[method]; if (!verb) fail('Método HTTP inválido. Utilize OBTER, PUBLICAR, ATUALIZAR ou EXCLUIR.'); return request(item.address, verb, item.body, item.headers); },
  };
}
