# Versões instaláveis

O Portugol Studio também é distribuído como aplicativo para Windows, macOS e Linux, com [Electron](https://www.electronjs.org/) e [electron-builder](https://www.electron.build/). O aplicativo usa o mesmo build do site, sem servidor e sem acesso à internet.

## Como funciona

- `desktop/main.cjs` cria a janela, serve `dist/` pelo protocolo `app://portugol/` e abre direto a IDE em `/app/`, sem a página inicial do site. Por isso os caminhos absolutos do Vite, o `fetch` de exemplos e da ajuda, o IndexedDB e `showSaveFilePicker` funcionam como na Web. A origem é fixa, então os programas salvos no aplicativo continuam disponíveis depois de uma atualização.
- `desktop/protocol.cjs` resolve os caminhos e bloqueia acessos fora de `dist/` (testado em `tests/desktop.test.js`).
- A página roda isolada (`sandbox`, `contextIsolation`, sem Node.js). Só são concedidas as permissões de pointer lock, tela cheia, escrita na área de transferência e arquivos escolhidos pelo usuário. Links externos abrem no navegador padrão.
- Os menus da IDE (Arquivo, Editar, Exemplos, Executar, Exibir, Ajuda) viram o menu nativo da janela. No macOS, ficam na barra de menus do sistema, junto com o menu do aplicativo e o menu Janela. A página envia a estrutura dos menus por `desktop/preload.cjs` (`menu:set`), `desktop/menu.cjs` monta o menu nativo e cada clique volta como `menu:command`. Os atalhos aparecem no menu, mas continuam tratados pela página, como na Web. Sem a barra de menus da página, Executar, Depurar e Parar ficam na linha das abas.
- Programas gráficos rodam em uma janela própria, sem menu, com o terminal abaixo do jogo. Executar de novo reaproveita a janela, e fechá-la encerra o programa. No aplicativo, a depuração também usa essa janela.
- Ao fechar com alterações não salvas, o aplicativo pede confirmação.

## Executar em desenvolvimento

```sh
npm run desktop:start
```

## Gerar instaladores

```sh
npm run desktop:dist              # sistema atual
npm run desktop:dist -- --win     # Windows: instalador .exe (NSIS) e .zip
npm run desktop:dist -- --linux   # Linux: .AppImage, .deb e .tar.gz
npm run desktop:dist -- --mac     # macOS: .dmg e .zip (x64 e arm64); requer um Mac
npm run desktop:dist -- --dir     # somente a pasta descompactada, para testes rápidos
```

O script compila o site com a base `/`, monta em `release/app` um pacote com apenas `dist/` e `desktop/` (as dependências já estão no bundle do Vite) e grava os instaladores em `release/`. Use `--x64` ou `--arm64` para escolher a arquitetura (no Linux, uma por vez).

Os arquivos têm nomes fixos, sem a versão, como `Portugol-Studio-windows-x64.exe`, `Portugol-Studio-macos-arm64.dmg` e `Portugol-Studio-linux-x64.AppImage`. Assim a página inicial aponta para `releases/latest/download/<arquivo>` e sempre entrega a versão mais recente. Se mudar algum nome, atualize os links em `index.html` e a lista em `tests/browser/landing.spec.js`.

## Publicar uma versão

O workflow `.github/workflows/desktop.yml` gera os instaladores nos três sistemas. Para publicar:

1. Atualize `version` no `package.json` e faça o commit.
2. Crie e envie a tag correspondente, por exemplo `git tag v0.3.0 && git push origin v0.3.0`.
3. O workflow cria um release em rascunho com os arquivos. Revise e publique em **Releases**. Os links de download da página inicial só funcionam depois que existir um release publicado (rascunhos não contam como `latest`).

O workflow também pode ser iniciado manualmente em **Actions → Versões instaláveis**; nesse caso os arquivos ficam apenas nos artefatos da execução.

## Assinatura de código

Os instaladores não têm assinatura de um certificado comercial:

- **Windows:** o SmartScreen pode exibir "O Windows protegeu o computador". Clique em **Mais informações → Executar assim mesmo**.
- **macOS:** o app recebe assinatura ad-hoc. Na primeira execução, clique com o botão direito em **Portugol Studio → Abrir**, ou execute `xattr -dr com.apple.quarantine "/Applications/Portugol Studio.app"`.
- **Linux:** torne o AppImage executável com `chmod +x`.

Para remover esses avisos, configure um certificado (Windows: variáveis `CSC_LINK`/`CSC_KEY_PASSWORD`; macOS: certificado Developer ID e notarização com `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` e `APPLE_TEAM_ID`) como secrets no workflow. Consulte a [documentação de assinatura do electron-builder](https://www.electron.build/code-signing).
