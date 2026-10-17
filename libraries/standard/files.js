export function installFilesLibrary(runtime) {
  const self = runtime;
  // ==================== BIBLIOTECA ARQUIVOS (VIRTUAL FILE SYSTEM) ====================
  const normalizePath = self.options.files?.normalizePath || (p => String(p).replaceAll('\\', '/').replace(/^(\.\/)+/, ''));
  const persist = (path, content) => self.options.files?.write(path, content);
  const descriptor = (handle, writing = false) => {
      const desc = self.__fileDescriptors.get(handle);
      if (!desc?.aberto) throw new Error('Arquivo fechado ou identificador inválido.');
      if (writing && desc.modo === 0) throw new Error('Arquivo aberto somente para leitura.');
      if (!writing && desc.modo !== 0) throw new Error('Arquivo aberto somente para escrita.');
      return desc;
  };

  runtime.Arquivos = {
      MODO_LEITURA: 0,
      MODO_ESCRITA: 1,
      MODO_ACRESCENTAR: 2,

      abrir_arquivo(caminho, modo) {
          const norm = normalizePath(caminho);
          caminho = norm;
          if (![0, 1, 2].includes(modo)) throw new Error('Modo de abertura inválido.');
          if (modo === 0 && !(norm in self.__vfs)) throw new Error('Arquivo não encontrado: ' + norm);
          const handle = self.__nextFileHandle++;
          let content = '';

          if (modo === 1) { // MODO_ESCRITA
              content = '';
              self.__vfs[caminho] = '';
              self.__vfs[norm] = '';
              persist(norm, '');
          } else { // MODO_LEITURA ou MODO_ACRESCENTAR
              content = self.__vfs[caminho] ?? self.__vfs[norm] ?? '';
          }

          if (modo === 2 && !(norm in self.__vfs)) { self.__vfs[norm] = ''; persist(norm, ''); }
          const lines = content.length > 0 ? content.split(/\r?\n/) : [];

          self.__fileDescriptors.set(handle, {
              path: caminho,
              normPath: norm,
              modo: modo,
              lines: lines,
              pointer: 0,
              aberto: true
          });

          return handle;
      },

      fechar_arquivo(endereco) {
          if (self.__fileDescriptors.has(endereco)) {
              const desc = self.__fileDescriptors.get(endereco);
              desc.aberto = false;
              self.__fileDescriptors.delete(endereco);
          }
      },

      fim_arquivo(endereco) {
          const desc = self.__fileDescriptors.get(endereco);
          if (!desc || !desc.aberto) return true;
          return desc.pointer >= desc.lines.length;
      },

      ler_linha(endereco) {
          const desc = descriptor(endereco);
          if (desc.pointer >= desc.lines.length) return '';
          const line = desc.lines[desc.pointer];
          desc.pointer++;
          return line;
      },

      escrever_linha(linha, endereco) {
          const desc = descriptor(endereco, true);
          desc.lines.push(String(linha));
          const newContent = desc.lines.join('\n');
          self.__vfs[desc.path] = newContent;
          self.__vfs[desc.normPath] = newContent;
          persist(desc.normPath, newContent);
      },

      substituir_texto(caminho, texto_pesquisa, texto_substituto, onlyFirst = false) {
          const norm = normalizePath(caminho);
          caminho = norm;
          let content = self.__vfs[caminho] ?? self.__vfs[norm] ?? '';
          if (onlyFirst) {
              content = content.replace(texto_pesquisa, texto_substituto);
          } else {
              content = content.split(texto_pesquisa).join(texto_substituto);
          }
          self.__vfs[caminho] = content;
          self.__vfs[norm] = content;
          persist(norm, content);
      },

      arquivo_existe(caminho) {
          const norm = normalizePath(caminho);
          return (caminho in self.__vfs) || (norm in self.__vfs);
      },

      apagar_arquivo(caminho) {
          const norm = normalizePath(caminho);
          delete self.__vfs[caminho];
          delete self.__vfs[norm];
          self.options.files?.remove(norm);
      },

      selecionar_arquivo(formatos, aceitar_todos) {
          const selected = window.prompt('Informe o caminho de um arquivo do repositório:');
          if (!selected) throw new Error('Seleção de arquivo cancelada.');
          const path = normalizePath(selected);
          if (!(path in self.__vfs)) throw new Error('Arquivo não encontrado: ' + path);
          return path;
      },

      criar_pasta(caminho) { normalizePath(String(caminho).replace(/[\\/]+$/, '')); /* Pastas são prefixos dos arquivos. */ },

      listar_arquivos(caminho, vetor) {
          if (Array.isArray(vetor)) {
              const prefix = caminho && caminho !== '.' ? normalizePath(caminho) + '/' : '';
              const files = Object.keys(self.__vfs).filter(path => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'));
              for (let i = 0; i < vetor.length; i++) {
                  vetor[i] = files[i] || '';
              }
          }
      },

      listar_pastas(caminho, vetor) {
          if (Array.isArray(vetor)) {
              const prefix = caminho && caminho !== '.' ? normalizePath(caminho) + '/' : '';
              const folders = [...new Set(Object.keys(self.__vfs).filter(p => p.startsWith(prefix) && p.slice(prefix.length).includes('/')).map(p => prefix + p.slice(prefix.length).split('/')[0]))];
              for (let i = 0; i < vetor.length; i++) vetor[i] = folders[i] || '';
          }
      }
  };
}
