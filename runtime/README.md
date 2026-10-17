# Runtime web independente

O núcleo não depende de React, Tailwind, componentes da IDE ou do servidor de arquivos.

- `index.js`: API pública (`PortugolRuntime`, `transpilePortugol`, `tokenize`, `createProjectFiles`, `mountProject`).
- `../core/`: análise léxica, sintática e semântica, transpilação e valores da execução.
- `../libraries/`: contratos e implementações das bibliotecas.
- `runtime.js`, `presentation.js` e `input/`: integração com o navegador.
- `project-files.js`: adaptador de arquivos incorporados com persistência em IndexedDB.
- `player.js`: interface mínima de execução usada na exportação.

A IDE importa a API pública. Os arquivos em `../js/` são reexports de compatibilidade.
`npm run build` gera `dist/runtime/portugol.js`, um bundle IIFE que expõe `PortugolWeb` e pode ser usado sem a IDE. Não precisa de servidor para executar o HTML exportado.

```js
import { PortugolRuntime, transpilePortugol, createProjectFiles } from './runtime/index.js';
const files = await createProjectFiles([], { projectId: 'meu-programa' });
const runtime = new PortugolRuntime(canvas, consoleElement, {
  files,
  masterVolume: 70,
  networkMode: 'direct',
});
try {
  await new Function('__runtime', transpilePortugol(codigo))(runtime);
} finally {
  runtime.destroy();
  await files.flush();
  await files.close();
}
```

O adaptador de arquivos deve oferecer `files` (snapshot de textos), `normalizePath`, `blob`, `image`, `write`, `writeBlob`, `remove` e `flush`. A IDE fornece seu próprio adaptador para o repositório do servidor. O programa exportado usa arquivos incorporados e gravações locais, com botões para baixar os arquivos.

`networkMode: 'direct'` acessa os endereços diretamente e respeita CORS. O modo padrão usa o proxy da IDE. O runtime executa código no contexto da página; não é uma sandbox para programas não confiáveis. O pacote Electron mantém o renderer sem acesso ao Node.js e com isolamento e sandbox ativados.

Também é possível gerar somente o runtime com `npm run build:runtime`, sem compilar a IDE.

A estrutura completa e as dependências estão em [Organização dos módulos](../docs/architecture.md).
