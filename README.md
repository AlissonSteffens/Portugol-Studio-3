# Portugol Studio Web

[**Abrir o Portugol Studio Web**](https://alissonsteffens.github.io/Portugol-Studio-3/) · [Publicações e verificações](https://github.com/AlissonSteffens/Portugol-Studio-3/actions/workflows/pages.yml)

IDE em React, CodeMirror, Tailwind CSS e Vite. O transpilador converte Portugol em JavaScript e executa no navegador. O build é um site estático: não depende de API, servidor de aplicação, autenticação ou banco de dados remoto.

## Desenvolvimento

Requer Node.js 22.12+.

```sh
npm ci
npm run dev
```

## Publicação estática

```sh
npm run build
```

Publique o conteúdo de `dist/` em GitHub Pages ou qualquer hospedagem estática. Os exemplos, a ajuda e o runtime estão incluídos nessa pasta.

Para hospedar em uma subpasta, defina `VITE_BASE_PATH` durante o build. No GitHub Pages deste repositório, use `/Portugol-Studio-3/`:

```powershell
$env:VITE_BASE_PATH = '/Portugol-Studio-3/'
npm run build
Remove-Item Env:VITE_BASE_PATH
```

O workflow `.github/workflows/pages.yml` testa e publica o site a cada push em `main`. Também pode ser iniciado manualmente em Actions → Publicar GitHub Pages → Run workflow. Ele usa Node.js 24, executa os testes da runtime e do navegador, valida a hospedagem em subpasta e publica somente `dist/`.

Em Settings → Pages, a origem da publicação deve ser GitHub Actions. Se algum teste falhar, o workflow interrompe a publicação.

O procedimento segue o [guia de publicação do Vite](https://vite.dev/guide/static-deploy.html).

Para testar o build localmente:

```sh
npm start
```

Abra http://127.0.0.1:3000. Esse processo apenas entrega arquivos estáticos; não fornece API. `PORT` e `HOST` configuram a porta e a interface. Abrir o `index.html` da IDE por `file://` não substitui uma hospedagem HTTP; o HTML exportado de um programa é independente e pode ser aberto diretamente.

Docker também serve somente arquivos estáticos:

```sh
docker build -t portugol-web .
docker run --rm -p 3000:80 portugol-web
```

## Armazenamento no navegador

- LocalStorage guarda códigos, abas abertas, aba ativa, tela atual, volume e preferências de layout.
- IndexedDB guarda os recursos binários de cada aba e um repositório compartilhado entre os programas deste navegador.
- O destino “Esta aba” preserva imagens, sons e outros arquivos junto à aba, inclusive após recarregar. O destino “Neste navegador” disponibiliza os arquivos para todos os programas.
- `Arquivos` trabalha com um snapshot na execução e persiste gravações, acréscimos e exclusões em ordem no IndexedDB. A conclusão aguarda as operações pendentes.
- `Graficos.carregar_imagem` usa imagens reais; `Graficos.salvar_imagem` guarda PNG no repositório local.
- Os dados pertencem à origem do site: mudar domínio, navegador ou protocolo não transfere os projetos. Limpar os dados do site remove esse armazenamento. Use salvar/exportar para manter cópias fora do navegador.
- O espaço disponível depende da quota do navegador. Falhas de persistência dos recursos aparecem como aviso.
- Não há compartilhamento remoto nem migração automática dos arquivos do antigo servidor. Arquivos antigos podem ser baixados e enviados novamente.

## Editor e ajuda

- Abrir e salvar `.por`, incluindo fontes Windows-1252.
- Ctrl + Enter executa; Esc interrompe; Ctrl + S salva; Ctrl + O abre; Alt + N cria; Ctrl + Shift + E exporta.
- Terminal com entrada assíncrona por `leia`, modo gráfico e suporte a imagens, áudio e fontes.
- Painéis recolhíveis e divisórias ajustáveis por mouse ou teclado; preferências restauradas automaticamente.
- Menu Exibir → Restaurar layout padrão.
- Catálogo com 120 exemplos e ajuda da versão Java: 48 tópicos, busca por assunto e documentação das funções, parâmetros, retornos e constantes das 11 bibliotecas.
- O exemplo Esfera 3D usa iluminação pela normal de cada face, com luz fixa e parcela ambiente. A e D mudam o sentido da rotação.
- Logo oficial da lâmpada, tema grafite e destaques amarelos; comandos na lateral e menus no topo.
- Aba fixa Início para voltar à home e botão para recolher o repositório no próprio cabeçalho.
- O painel gráfico pode ser aberto em outra aba, mantendo a aba principal aberta.

## Internet e exportação

A biblioteca Internet faz requisições diretamente aos sites indicados pelo programa, sem proxy. O site consultado precisa permitir acesso do navegador (CORS). HTTPS não pode acessar endpoints HTTP bloqueados como conteúdo misto. Sites externos indisponíveis ou sem CORS não têm substituição automática. Isso não é uma dependência de API da IDE: é uma chamada externa solicitada pelo próprio programa.

A exportação acontece inteiramente no navegador:

- **HTML independente:** inclui código compilado, runtime e recursos em um arquivo. Funciona sem a IDE.
- **Projeto Electron (.zip):** inclui o HTML e configuração para gerar um aplicativo localmente com Node.js. O pacote contém instruções.

Gerar `.exe` diretamente pelo site foi removido, pois exigia compilação em um servidor. O pacote Electron mantém esse caminho com geração no computador do usuário.

## Verificação

```sh
npm test
npm run build
npx playwright test
```

Os testes no navegador cobrem execução, entrada de dados, canvas em outra aba, armazenamento de texto e imagens, exportação independente, ajuda, layout e recuperação após recarregar. O teste estático confirma que a aplicação não faz chamadas a `/api/`.

Para validar uma publicação em subpasta, faça o build com `VITE_BASE_PATH=/Portugol-Studio-3/` e execute:

```sh
npx playwright test --config playwright.pages.config.js
```

`npm run examples:run` executa exemplos com o servidor de desenvolvimento ativo. Os arquivos são isolados no navegador de testes, sem acessar os projetos pessoais do usuário.

## Conteúdo original

A ajuda em `public/ajuda` foi adaptada do Portugol Studio 2 (UNIVALI-LITE); origem e licença estão nessa pasta. O script `python scripts/import-help.py CAMINHO_DO_REPOSITORIO` permite repetir a importação. Os contratos das bibliotecas estão em `runtime/core/library-contracts.js`.
