# Desenvolvimento e testes

A interface usa React e CodeMirror, com estilos em Tailwind CSS e build pelo Vite. O transpilador converte Portugol em JavaScript, executado pelo runtime no navegador.

## Preparar o ambiente

Use Node.js 22.12 ou superior; o CI usa Node.js 24.

```sh
npm ci
npx playwright install chromium
npm run dev
```

Em Linux, instale as dependências do navegador com `npx playwright install --with-deps chromium`, como no CI.

## Verificação completa

```sh
npm run test:all
```

O script executa, em ordem:

1. Testes do runtime, compilador, diagnósticos e serviços com `npm test`.
2. Build local e todos os testes de interface com Playwright.
3. Build com a base `/Portugol-Studio-3/` e teste do site estático nessa subpasta.
4. Restauração do build local em `dist/`.

Se uma suíte falhar, as demais verificações independentes continuam, e o comando termina com erro. Os testes de navegador exigem um build válido; se esse build falhar, a suíte correspondente não é executada. Não há retries automáticos para esconder falhas.

O Playwright inicia e encerra os servidores necessários. As portas 4173 e 4174 devem estar disponíveis. As gravações dos testes usam sessões isoladas do navegador, sem acessar os projetos pessoais do usuário.

Para rodar uma parte isoladamente:

```sh
npm test
npm run build
npx playwright test
npx playwright test tests/browser/block-worlds.spec.js
```

Os testes da interface cobrem edição, mensagens, depuração, jogos, entrada de dados, execução em outra aba, recursos, exportação, ajuda e restauro da sessão. O teste de publicação verifica recursos e execução sem chamadas à API da IDE.

Capturas de tela e traces das falhas ficam em `test-results/browser/` e `test-results/pages/`. No CI, são publicados no artefato `playwright-failures`. Para abrir um trace:

```sh
npx playwright show-trace CAMINHO_DO_TRACE.zip
```

## Antes de enviar ao remote

O `prepare` do npm instala o hook de pré-push a partir de `scripts/hooks/pre-push`. Para instalar ou atualizar em um checkout existente:

```sh
npm run hooks:install
```

O hook exige que as referências enviadas apontem para o HEAD e que não haja mudanças pendentes, incluindo arquivos não rastreados. Em seguida, executa `npm run test:all` e bloqueia o push se qualquer etapa falhar ou se o conteúdo mudar durante a verificação. Assim, os arquivos testados correspondem ao commit enviado. Exclusões de referências remotas não exigem build.

Se já houver um hook personalizado, o instalador o preserva e pede a integração de `node scripts/pre-push.js`. Em checkouts sem Git e no CI, a instalação é dispensada. Não ignore o pré-push nem envie após uma verificação incompleta. As regras para agentes estão em `AGENTS.md`.

Os testes locais usam Node.js 24 e o Chromium instalado pelo Playwright. O GitHub Actions continua validando em Linux antes do deploy; diferenças de sistema operacional e infraestrutura só podem ser confirmadas nesse ambiente.

## Explorando o catálogo

`npm run examples:run`, com o servidor de desenvolvimento ativo, faz uma execução exploratória dos exemplos do catálogo, com entrada simulada e limites de tempo. O relatório fica em `reports/examples.json`. Essa ferramenta não faz parte das suítes de regressão de `test:all`: exemplos interativos podem ser interrompidos por limite e precisam de avaliação do relatório.

## Dados e recursos

LocalStorage guarda código, abas e preferências. IndexedDB guarda recursos de cada aba e o repositório compartilhado. Os dados pertencem à origem do site; limpar os dados do navegador remove esse armazenamento.

A biblioteca `Arquivos` usa um snapshot durante a execução e persiste as alterações no repositório local. A biblioteca `Internet` faz requisições diretamente ao endereço solicitado pelo programa, sujeitas a CORS e às regras do navegador para conteúdo HTTP em páginas HTTPS.

A exportação gera um HTML independente ou um projeto Electron para compilar localmente. Não há serviço remoto de compilação.

## Conteúdo da ajuda

A ajuda original pode ser importada com `python scripts/import-help.py CAMINHO_DO_REPOSITORIO`. Os tópicos escritos para a versão Web estão registrados em `scripts/web-help.json` e são mantidos na importação. Os contratos das bibliotecas ficam em `libraries/contracts/index.js`.
