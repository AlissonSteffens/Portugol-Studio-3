# Portugol Studio Web

Um ambiente para aprender programação em Portugol, direto no navegador.

[**Página inicial**](https://alissonsteffens.github.io/Portugol-Studio-3/) · [**Abrir a IDE**](https://alissonsteffens.github.io/Portugol-Studio-3/app/)

## O que você pode fazer

- Escrever e executar programas, com mensagens de erro, avisos e sugestões de correção.
- Depurar passo a passo, usar pontos de parada e acompanhar variáveis.
- Explorar exemplos e ajuda, criar programas gráficos e exportar suas criações.

## Organização da IDE

- **Barra superior:** menus (Arquivo, Editar, Exemplos, Executar, Exibir, Ajuda) e os botões Executar, Depurar e Parar.
- **Barra lateral esquerda:** troca de tela, entre Início (exemplos e arquivos recentes), Editor e Ajuda.
- **Tela do editor:** abas dos arquivos abertos, o código e o terminal abaixo dele. O painel à esquerda do código reúne as ferramentas do programa (Estrutura, Problemas e Recursos). Ele pode ser ocultado pelo botão no início da linha de abas.
- **Programas gráficos** rodam em outra aba do navegador (no aplicativo instalado, em outra janela), com o terminal recolhível abaixo do jogo. Fechar essa aba encerra o programa. A depuração na Web continua no painel, ao lado do código. Para manter tudo no painel, desmarque **Exibir › Programas gráficos em aba separada**. Em celulares e tablets o jogo sempre ocupa a própria tela.

Os programas e recursos ficam armazenados no navegador. Salve seus arquivos `.por` ou exporte o projeto para manter uma cópia fora dele.

Nos exemplos **Missão Órbita**, **Pista Neon**, **Arena Pulsar** e **Corte Tropical**, o jogo ocupa a tela e acompanha a orientação do celular. Os controles flutuam sobre o campo: joystick esquerdo para setas/WASD, direito para posição ou movimento XY do mouse e botões para ações simultâneas. Também funcionam na aba de execução e no HTML exportado. Use **Sair da tela cheia** para voltar ao player/editor.

## Executar localmente

Requer Node.js 22.12 ou superior e npm. O CI usa Node.js 24.

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite no terminal. A página inicial fica na raiz e a IDE em `/app/`.

## Testar

Instale o navegador de testes na primeira vez:

```sh
npx playwright install chromium
npm run test:all
```

O comando executa os testes do runtime, da interface e da publicação em subpasta. Para executar somente os testes do runtime, use `npm test`.

`npm ci` também instala o hook de pré-push. Ele exige alterações commitadas e executa `npm run test:all` antes de enviar o HEAD ao remote, bloqueando o envio em caso de falha. Para instalar ou atualizar o hook em um checkout já existente, execute `npm run hooks:install`.

## Build e publicação

```sh
npm run build
npm start
```

Abra http://127.0.0.1:3000 (página inicial) ou http://127.0.0.1:3000/app/ (IDE). O build em `dist/` pode ser publicado em uma hospedagem estática. Neste repositório, o GitHub Actions verifica e publica no Pages a cada push em `main`.

## Aplicativo para computador

Também há versões instaláveis para Windows, macOS e Linux, disponíveis em [Releases](https://github.com/AlissonSteffens/Portugol-Studio-3/releases). Para gerá-las localmente, use `npm run desktop:dist`. Consulte [Versões instaláveis](docs/desktop.md).

## Documentação

- [Organização dos módulos](docs/architecture.md)
- [Desenvolvimento e testes](docs/development.md)
- [Publicação e GitHub Pages](docs/deployment.md)
- [Versões instaláveis](docs/desktop.md)
- [Runtime e buffers gráficos](docs/runtime-performance.md)
- [Diagnósticos e compatibilidade com o core Java](docs/java-diagnostics.md)

## Origem

Este projeto dá continuidade ao Portugol Studio, criado pela UNIVALI-LITE, com uma implementação para a Web. A origem e a licença do conteúdo da ajuda estão em [public/ajuda/ORIGEM.md](public/ajuda/ORIGEM.md) e [public/ajuda/LICENSE.md](public/ajuda/LICENSE.md).
