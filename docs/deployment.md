# Publicação

`npm run build` gera um site estático em `dist/`, incluindo runtime, exemplos e ajuda. Publique o conteúdo dessa pasta em uma hospedagem HTTP. A IDE não requer API, autenticação ou banco de dados remoto.

## GitHub Pages

O workflow `.github/workflows/pages.yml` usa Node.js 24 e executa `npm run test:all` antes da publicação. Uma falha impede o deploy. Os diagnósticos dos testes ficam no artefato `playwright-failures` da execução.

Em **Settings → Pages**, selecione **GitHub Actions** como origem. O workflow roda a cada push em `main` e também pode ser iniciado manualmente em **Actions → Publicar GitHub Pages → Run workflow**.

A base deste repositório é `/Portugol-Studio-3/`. Para gerar esse build manualmente no PowerShell:

```powershell
$env:VITE_BASE_PATH = '/Portugol-Studio-3/'
npm run build
Remove-Item Env:VITE_BASE_PATH
npx playwright test --config playwright.pages.config.js
```

Em um shell POSIX:

```sh
VITE_BASE_PATH=/Portugol-Studio-3/ npm run build
npx playwright test --config playwright.pages.config.js
```

Se o nome do repositório ou a subpasta mudar, ajuste a base no workflow, no script `scripts/check.js` e na configuração `playwright.pages.config.js`.

## Servir o build local

```sh
npm run build
npm start
```

Abra http://127.0.0.1:3000. `PORT` e `HOST` configuram a porta e a interface. Esse servidor apenas entrega arquivos estáticos.

Abrir o `index.html` da IDE por `file://` não substitui uma hospedagem HTTP. O HTML exportado de um programa é independente e pode ser aberto diretamente.

## Docker

```sh
docker build -t portugol-web .
docker run --rm -p 3000:80 portugol-web
```

O contêiner também serve somente os arquivos estáticos.
