# Portugol Studio Web

IDE em React 19, Tailwind CSS 4 e Vite. O transpilador converte Portugol em JavaScript, executado no navegador com as bibliotecas da runtime. Interface organizada em componentes de editor, terminal, gráficos e arquivos, mantendo o tema escuro da IDE.

## Desenvolvimento

Requer Node.js 22.12+ (recomendado: Node.js 24).

```sh
npm install
npm run dev
```

Abra a URL exibida pelo Vite. O próprio servidor de desenvolvimento fornece a API de arquivos.

## Produção

```sh
npm ci
npm run build
npm start
```

Acesse http://127.0.0.1:3000. Um único processo Node serve o frontend compilado e o repositório. Não é mais possível abrir index.html diretamente pelo sistema de arquivos.

Configuração por variáveis de ambiente:

| Variável | Padrão | Finalidade |
| --- | --- | --- |
| PORT | 3000 | Porta HTTP |
| HOST | 127.0.0.1 | Interface de rede; use 0.0.0.0 em containers |
| PORTUGOL_DATA_DIR | .data/files | Diretório persistente dos objetos |

O Dockerfile gera uma imagem com o mesmo servidor, sem dependências npm em produção:

```sh
docker build -t portugol-web .
docker run --rm -p 3000:3000 -v portugol-data:/app/data portugol-web
```

O volume deve ser preservado entre deploys. Em Kubernetes, monte armazenamento persistente no mesmo pod da aplicação; nenhum pod de S3/MinIO é necessário. O armazenamento atual suporta um processo servidor por diretório de dados.

## Modo gráfico em outra aba

Use **Abrir em nova aba** no painel gráfico. O mesmo canvas é movido para uma aba exclusiva: execução, imagens, mouse e teclado continuam ligados à runtime original. Ao fechar a aba ou clicar em **Trazer para o painel**, o canvas retorna. A aba principal precisa continuar aberta. O navegador pode precisar de permissão para pop-ups e decide se abre aba ou janela conforme sua configuração.

## Repositório de arquivos

- Upload de texto, imagens e outros arquivos, até 20 MB por objeto.
- Pastas são prefixos, como `imagens/fundo.png`; informe o prefixo no campo Pasta de destino.
- Listagem, download e exclusão com confirmação pela interface.
- Os dados ficam no servidor e sobrevivem ao fechamento do navegador e ao reinício do processo.
- A biblioteca `Arquivos` recebe um snapshot ao iniciar o programa. Escrita, acréscimo, substituição e exclusão são persistidos em ordem durante a execução; a finalização aguarda a fila pendente.
- Alterações externas entram no próximo programa. Execuções simultâneas que gravam o mesmo caminho seguem a última escrita.
- `Graficos.carregar_imagem` carrega a imagem real do repositório, inclusive em inicializadores. `Graficos.salvar_imagem` salva PNG; `largura_imagem` e `altura_imagem` informam suas dimensões.
- Pastas vazias não são armazenadas. `Arquivos.selecionar_arquivo` solicita o caminho de um objeto já enviado.

Exemplo de escrita:

```portugol
programa
{
    inclua biblioteca Arquivos --> a
    funcao inicio()
    {
        inteiro arquivo = a.abrir_arquivo("dados/resultado.txt", a.MODO_ESCRITA)
        a.escrever_linha("Olá, arquivo!", arquivo)
        a.fechar_arquivo(arquivo)
    }
}
```

Exemplo gráfico (envie `fundo.png` na pasta `imagens`):

```portugol
programa
{
    inclua biblioteca Graficos --> g
    funcao inicio()
    {
        g.iniciar_modo_grafico()
        inteiro imagem = g.carregar_imagem("imagens/fundo.png")
        g.desenhar_imagem(0, 0, imagem)
        g.renderizar()
        g.salvar_imagem(imagem, "imagens/copia.png")
    }
}
```

A API customizada possui `GET /api/files` e `GET`, `PUT`, `DELETE /api/files?path=...`. Os nomes virtuais são normalizados e convertidos em identificadores SHA-256 no disco. Escritas usam arquivo temporário e substituição atômica. Downloads não executam HTML ou SVG na origem da IDE. Não implementa o protocolo S3.

Esta versão tem um repositório compartilhado por instância, sem autenticação ou isolamento por aluno. Para acesso multiusuário público, é necessário acrescentar identidade e autorização antes de expor a API. As outras limitações das bibliotecas e do transpilador da v0 continuam existindo; os 120 exemplos são carregados de arquivos reais; uma rodada automatizada não cobre todas as possíveis interações de um jogo.

## Editor e execução

- Abrir e salvar `.por`, incluindo abertura de arquivos legados Windows-1252.
- Arrastar um arquivo `.por` sobre o editor.
- Editor com destaque de sintaxe, números de linha e indentação por Tab.
- Terminal com `escreva` e entrada assíncrona por `leia`.
- Ctrl + Enter executa; Esc interrompe.
- Visualização do JavaScript transpilado.
- Painéis de gráfico e terminal separados ou juntos.

## Estrutura

```text
src/
  App.jsx
  components/       Editor, Terminal, Graphics, FileRepository
  services/         Cliente HTTP e snapshot para a runtime
  styles.css        Tailwind e estilos do editor
js/
  transpiler.js     Transpilador em módulo ES
  runtime.js        Bibliotecas e execução
  compiler.js       Parser e geração tipada de JavaScript
  browser-libraries.js  Imagens, fontes, áudio e Internet
  library-contracts.js Contratos derivados das bibliotecas Java
public/exemplos/
  index.json        Catálogo, descrições e referências aos recursos
  **/*.por          Os 120 programas de exemplo
  **/*              Imagens, sons, fontes e dados de apoio
scripts/
  sync-examples.js  Sincronização a partir do projeto pai
  run-examples.js   Execução dos exemplos em Chromium
server/
  repository.js     API e persistência dos objetos
  index.js          Servidor de produção
```

## Verificação

```sh
npm test
npm run build
npx playwright install chromium
npx playwright test
```

Os testes Node cobrem persistência entre instâncias, arquivos binários, caminhos inválidos, modos de leitura/escrita/acréscimo e integração com o transpilador. Os testes de navegador cobrem terminal, entrada, teclado na aba gráfica, retorno do canvas, upload de imagem e arquivos persistentes. Os testes de navegador usam `.data/browser-tests`, separado do repositório normal.

## Exemplos originais em arquivos

A fonte é `../ide/src/main/assets/exemplos`, no projeto Portugol Studio. Os 120 programas e 310 recursos são publicados em `public/exemplos`, preservando a hierarquia original. `index.json` contém nome, categoria, descrição, caminho do `.por`, recursos e ajustes; nenhum código Portugol é embutido no catálogo ou no bundle JavaScript.

O catálogo é carregado por HTTP e o arquivo `.por` é lido sob demanda ao escolher o exemplo. Há detecção de UTF-8/Windows-1252. As imagens, sons e fontes usam caminhos relativos ao diretório do programa; os dados textuais são preparados ao iniciar. Arquivos do repositório têm prioridade sobre os recursos originais.

```sh
npm run sync:examples
npm run sync:contracts
```

Dois originais estão incompletos: `bibliotecas/tipos/logico.por` possui um caso vazio, e `jogos/arkanoid.por` possui colisões com parâmetro sem nome e variáveis indefinidas. O sincronizador aplica correções somente às cópias web e registra os ajustes no JSON; a pasta pai é preservada.

O compilador trata parâmetros por referência, conversões tipadas, divisão inteira, precedência de operadores, inicialização de vetores/matrizes e índices. Os contratos das chamadas de biblioteca são derivados das classes Java originais. Sons usam os arquivos reais com HTML Audio; fontes usam FontFace; imagens podem ser redimensionadas e transformadas. Os caminhos retornados por `Util.obter_diretorio_usuario` são virtuais (`usuario`), sem acesso ao sistema de arquivos do computador do aluno.

A biblioteca Internet acessa URLs públicas pela rota `/api/internet` no mesmo servidor, evitando restrições de CORS no navegador. A rota rejeita redes privadas e protocolos diferentes de HTTP/HTTPS, limita respostas a 20 MB e possui timeout. Os exemplos da Internet continuam dependendo da disponibilidade dos serviços originais; respostas não são simuladas. `baixar_imagem` acrescenta a extensão conforme o tipo recebido, como a biblioteca Java.

Para executar todos os exemplos (com `npm run dev` ativo):

```sh
npm run examples:run
```

O runner usa Chromium, entradas automáticas e um repositório isolado em memória. Não altera os arquivos do usuário. Registra o resultado de cada programa em `reports/examples.json`, incluindo saída, quadros, entradas e gravações. Programas contínuos e com espera são interrompidos por um limite de tempo/instruções; isso verifica carga e execução inicial, não todas as fases e combinações de entrada de cada jogo. Os testes Java/Swing do projeto pai não fazem parte desse runner.

## Tela inicial e menus

A aplicação abre na tela inicial, com ações de novo arquivo e abertura de `.por`, acesso aos arquivos da sessão e catálogo com busca por nome/categoria. Cada arquivo ou exemplo é aberto em uma aba separada; voltar à tela inicial preserva o editor e a execução.

- **Arquivo**: novo, abrir, salvar, salvar como, fechar e tela inicial.
- **Editar**: desfazer, refazer, selecionar e copiar código.
- **Executar**: executar, parar, limpar saída e ver JavaScript.
- **Exibir**: editor, tela inicial, repositório, gráfico e terminal.

Atalhos: Alt + N (novo), Ctrl + O (abrir), Ctrl + S (salvar), Ctrl + Shift + S (salvar como), Ctrl + Z (desfazer), Ctrl + Shift + Z/Ctrl + Y (refazer), Ctrl + Enter (executar) e Esc (parar). Alt + N evita o atalho Ctrl + N reservado pelo navegador.

Arquivos alterados recebem um indicador na aba. Ao fechar, é possível salvar uma cópia, descartar ou cancelar. Há aviso do navegador ao sair com alterações não salvas. As abas são mantidas durante a sessão; salve os `.por` para conservar o trabalho entre sessões.

## Recursos do programa e substituições locais

Os exemplos ficam no menu **Exemplos**, com busca e categorias, e continuam disponíveis na tela inicial. Não há mais seletor permanente na barra superior.

O repositório mostra os caminhos identificados no código, os recursos correspondentes do exemplo e os arquivos enviados. A análise reconhece literais, prefixos, concatenações e alguns caminhos variáveis; caminhos totalmente calculados a partir de dados externos podem não ser conhecidos antes de executar. Arquivos enviados continuam visíveis mesmo sem referência explícita no código.

Imagens têm prévias. **Substituir localmente** escolhe um arquivo do computador e mantém o caminho usado pelo programa. A alteração pertence à aba e tem prioridade na execução sobre o servidor e os recursos originais. **Desfazer troca** remove a alteração local e recupera a versão anterior. Também é possível adicionar um arquivo no caminho que o código espera, inclusive em um programa próprio.

O destino padrão de novos arquivos é **Esta aba (local)**. Para persistir um arquivo compartilhado entre programas, selecione **Servidor compartilhado**. Recursos locais duram a sessão; use **Baixar** para guardá-los. Salvar o `.por` salva somente o código, sem embutir imagens ou outros recursos. Fechar uma aba com recursos locais ou sair da aplicação exibe um aviso.

## Editor CodeMirror e layout responsivo

O editor usa CodeMirror 6, com tema inspirado no IntelliJ, números de linha, busca/substituição, recolhimento de blocos, indentação de quatro espaços, fechamento de delimitadores e histórico independente por aba. A barra de status acompanha linha e coluna. As ações dos menus de edição usam o histórico do próprio editor.

O autocomplete é ativado ao digitar ou por **Ctrl + Espaço**, e aceita uma sugestão com Enter/Tab. Ele oferece variáveis e parâmetros visíveis, funções declaradas no programa, palavras da linguagem, funções nativas e membros das bibliotecas disponíveis na runtime. As assinaturas e nomes dos parâmetros vêm das classes Java originais, através de `npm run sync:contracts`.

Ao escolher uma função de biblioteca sem import, o editor insere uma chamada qualificada e a diretiva `inclua biblioteca` no bloco do programa. Se a biblioteca já tiver um apelido (por exemplo, `Matematica --> mat`), a conclusão usa `mat` e não duplica a diretiva. A inclusão e a chamada fazem parte de uma mesma edição. Comentários e textos não recebem sugestões de código.

Em telas grandes, recursos, editor e execução ficam em colunas, com uma barra lateral de ferramentas. Em tablets, a execução ocupa o painel inferior. Em celulares, os botões **Editor**, **Recursos** e **Execução** alternam a área visível; os componentes continuam montados para preservar código, arquivos locais e execução. Os menus se posicionam dentro da largura da tela. O editor é empacotado em um módulo separado, e os ícones usam Lucide.

Ao passar o mouse em funções ou constantes das bibliotecas, o editor apresenta a documentação original do Portugol Studio, com assinatura, descrição, parâmetros e retorno. Os aliases das bibliotecas também são reconhecidos. A mesma documentação aparece nas sugestões de autocomplete. `npm run sync:contracts` atualiza esses dados a partir das anotações Java.

A tela inicial reúne ações de criar/abrir programas, arquivos da sessão, exemplos em destaque com suas prévias originais e um catálogo pesquisável por nome e categoria. As prévias são descritas no catálogo JSON e atualizadas por `npm run sync:examples`.

## Exportar programas

Em **Arquivo → Exportar projeto…**, escolha:

- **HTML independente:** um `.html` com JavaScript compilado, runtime, imagens, sons, fontes e dados incorporados. Abra diretamente no navegador ou publique em hospedagem estática. Não depende da IDE nem de `/api/files`.
- **Executável Windows:** gera um `.exe` portátil com Electron no servidor local Windows. A primeira geração baixa ferramentas e pode levar alguns minutos. O computador que executar o arquivo não precisa de Node.js. Essa opção requer as dependências de desenvolvimento da IDE instaladas.
- **Projeto Electron:** um ZIP com o HTML, launcher e `package.json`. Extraia, execute `npm install` e `npm start`. Para gerar um executável Windows, use `npm run build:win`. A geração direta não está disponível no container Linux, mas HTML e ZIP continuam disponíveis.

A exportação inclui os recursos referenciados pelo programa (inclusive caminhos calculados identificados pelo analisador) e os arquivos locais da aba. Arquivos de outros exemplos ou do servidor sem referência no código não são incluídos. Substituições locais têm prioridade. Há um limite de 128 MB de recursos por exportação. Arquivos de saída não precisam existir antes da exportação. Caminhos calculados dependem dos arquivos incluídos; o exportador não executa o código para descobrir recursos.

Gravações dos programas exportados ficam no IndexedDB do navegador/aplicativo, isoladas pelo conteúdo do projeto. A seção **Arquivos do projeto** permite baixar os arquivos. O HTML acessa a Internet diretamente e está sujeito a CORS; não inclui o proxy da IDE. Executáveis portáteis são gerados sem assinatura digital.

## Organização do runtime

O núcleo está em `runtime/core/`, e `runtime/index.js` é a API pública consumida pela IDE. `runtime/project-files.js` fornece arquivos incorporados e persistência local; `runtime/player.js` oferece uma interface mínima para os programas exportados. O build produz `dist/runtime/portugol.js`, utilizável sem React/Tailwind. Consulte `runtime/README.md` para integrar a API.

O executável incorpora o Chromium/Electron. A geração direta usa empacotamento sem compressão para ser rápida, por isso o arquivo é grande (cerca de 370 MiB neste ambiente). O pacote Electron usa a compressão padrão ao gerar com `npm run build:win`, produzindo um arquivo menor com maior tempo de build.

