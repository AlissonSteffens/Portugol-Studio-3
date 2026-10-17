# Regras do repositório

- Antes de qualquer push, execute `npm run test:all` no conteúdo exato que será enviado e exija código de saída zero. Esse comando é o mesmo usado pelo workflow do GitHub Pages: testes do runtime, build local, testes do navegador, build com `/Portugol-Studio-3/` e teste estático nessa subpasta.
- Qualquer alteração posterior em código, testes, dependências ou configuração invalida a verificação anterior. Corrija a falha e execute novamente a verificação completa antes de enviar.
- Não envie commits com verificações falhando ou incompletas. Não use `--no-verify`, `HUSKY=0`, retries, remoção de testes ou aumento de timeout para contornar uma falha.
- Instale o hook versionado com `npm run hooks:install` (também executado pelo `prepare` de `npm install`/`npm ci`). O pré-push exige uma árvore limpa e verifica o HEAD que está sendo enviado. Não substitua hooks personalizados sem preservar seu comportamento.
- Para falhas de navegador, investigue o estado real, os eventos e os frames renderizados. Testes de pointer lock devem considerar movimentos nativos na captura e confirmar que o jogo processou a entrada antes de comparar imagens.
- Use Node.js 24 e Chromium do Playwright para aproximar o ambiente local do CI. O workflow em Linux continua sendo a verificação de publicação; uma execução local aprovada não substitui o resultado dele.
