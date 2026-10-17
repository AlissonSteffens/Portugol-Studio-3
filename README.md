# Portugol Studio Web

Um ambiente para aprender programação em Portugol, direto no navegador.

[**Abrir a IDE**](https://alissonsteffens.github.io/Portugol-Studio-3/)

## O que você pode fazer

- Escrever e executar programas, com mensagens de erro, avisos e sugestões de correção.
- Depurar passo a passo, usar pontos de parada e acompanhar variáveis.
- Explorar exemplos e ajuda, criar programas gráficos e exportar suas criações.

Os programas e recursos ficam armazenados no navegador. Salve seus arquivos `.por` ou exporte o projeto para manter uma cópia fora dele.

Nos exemplos **Missão Órbita**, **Pista Neon**, **Arena Pulsar** e **Corte Tropical**, o jogo ocupa a tela e acompanha a orientação do celular. Os controles flutuam sobre o campo: joystick esquerdo para setas/WASD, direito para posição ou movimento XY do mouse e botões para ações simultâneas. Também funcionam na aba de execução e no HTML exportado. Use **Sair da tela cheia** para voltar ao player/editor.

## Executar localmente

Requer Node.js 22.12 ou superior e npm. O CI usa Node.js 24.

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite no terminal.

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

Abra http://127.0.0.1:3000. O build em `dist/` pode ser publicado em uma hospedagem estática. Neste repositório, o GitHub Actions verifica e publica no Pages a cada push em `main`.

## Documentação

- [Organização dos módulos](docs/architecture.md)
- [Desenvolvimento e testes](docs/development.md)
- [Publicação e GitHub Pages](docs/deployment.md)
- [Runtime e buffers gráficos](docs/runtime-performance.md)
- [Diagnósticos e compatibilidade com o core Java](docs/java-diagnostics.md)

## Origem

Este projeto dá continuidade ao Portugol Studio, criado pela UNIVALI-LITE, com uma implementação para a Web. A origem e a licença do conteúdo da ajuda estão em [public/ajuda/ORIGEM.md](public/ajuda/ORIGEM.md) e [public/ajuda/LICENSE.md](public/ajuda/LICENSE.md).
