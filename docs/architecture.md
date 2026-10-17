# Organização dos módulos

O código é dividido por responsabilidade. A IDE usa a linguagem e o runtime; o core não depende de React, do editor nem dos componentes da IDE.

```text
core/                      Linguagem Portugol
  index.js                 API da linguagem
  compiler.js              Orquestra análise e geração
  lexical/                 Tokenização, palavras reservadas e erros léxicos
  syntax/                  Parser da AST e precedência dos operadores
  semantic/                Símbolos, escopos, tipos e compatibilidade
  transpilation/           Geração de JavaScript e seleção de funções síncronas
  diagnostics/             Estruturas de diagnóstico e erros
  execution/               Valores, referências, arrays e depurador

libraries/                 Bibliotecas disponíveis nos programas Portugol
  index.js                 API dos contratos e da validação
  contracts/               Assinaturas, constantes e extensões Web
  standard/                Graficos, Matematica, Util, Teclado, Mouse,
                           Tipos, Calendario, Texto e Arquivos
  graphics/                Buffers e gravação dos comandos de desenho
  input/                   Captura do mouse
  browser.js               Implementações que usam APIs do navegador
  extended.js              Complementos de bibliotecas
  navigator.js             Biblioteca Navegador
  install.js               Composição das implementações no runtime
  validation.js            Validação das chamadas em execução

runtime/                   Integração da execução com o navegador
  index.js                 API pública do runtime exportável
  runtime.js               Ciclo de execução, eventos e entrada/saída
  presentation.js          Apresentação dos frames
  input/                   Perfil de entrada e controles de toque
  project-files.js          Arquivos dos projetos exportados
  player.js                Player dos projetos exportados

ide/src/                   Aplicação React
  components/              Interface, editor, terminal, ajuda e gráficos
  editor/                  Integração com CodeMirror e diagnósticos visuais
  hooks/                   Estado e ciclo de vida da interface
  services/                Documentos, armazenamento, recursos e exportação
```

## Fluxo da linguagem

`tokenize` transforma o texto em tokens. `Parser` constrói a AST. `semanticDiagnostics` verifica essa árvore. `Generator` transforma a AST validada em JavaScript. `core/compiler.js` coordena as etapas, preservando os diagnósticos e impedindo a geração quando há erros. `transpilePortugol` é o ponto de entrada que recebe texto.

O parser pode ser usado sem executar a análise semântica ou gerar JavaScript. O editor e a detecção de controles importam diretamente o tokenizador quando só precisam dos tokens.

## Dependências

- `core/` consulta os contratos das bibliotecas para validar inclusões e chamadas. A validação de chamadas do executor também usa esses contratos. O core não importa as implementações das bibliotecas.
- `libraries/` usa os erros do core e recebe a instância do runtime nos instaladores. Cada biblioteca padrão tem seu próprio instalador; `install.js` preserva a ordem de composição dos complementos.
- `runtime/` combina os valores e o depurador do core com as bibliotecas, canvas, eventos e entrada/saída. Funciona também no player sem a IDE.
- `ide/` consome esses módulos e acrescenta recursos próprios da edição, como sugestões de correção, navegação de símbolos e documentos recentes.

O bundle independente continua sendo gerado de `runtime/index.js` por `npm run build:runtime` e pelo plugin do Vite. Os arquivos em `js/` são reexports de compatibilidade dos caminhos antigos; novos imports devem usar os módulos acima.

Os scripts de sincronização gravam os contratos em `libraries/contracts/` e as tabelas de tipos em `core/semantic/`. Os testes ficam em `tests/`, e `npm run test:all` valida a linguagem, a IDE, o runtime exportado e a publicação em subpasta.
