# Revisão do projeto

## Implementado nesta revisão

- Núcleo movido para `runtime/core`, API pública em `runtime/index.js` e reexports compatíveis em `js`.
- Bundle independente do runtime, gerado com o build da IDE.
- Exportação HTML único, incluindo recursos e substituições locais.
- Adaptador de arquivos para programas exportados, com IndexedDB e download de arquivos gerados.
- Exportação Electron em ZIP e geração direta de executável portátil no Windows local.
- Acesso à rede configurável: proxy na IDE, acesso direto no programa exportado.
- Fontes carregadas removidas ao destruir a execução; carregamentos concluídos após interrupção não são registrados.
- Desenhos pendentes descartados ao redimensionar a tela gráfica.
- Janela de exportação com foco contido, bloqueio de atalhos da IDE, andamento e mensagens de erro.

## Melhorias seguintes

1. **Recursos por projeto:** o repositório compartilhado é global. Para preservar caminhos construídos dinamicamente, o exportador inclui seus arquivos. Projetos com manifesto explícito de recursos permitiriam exportar somente o necessário.
2. **Salvar o projeto completo:** hoje `.por` guarda código e recursos locais ficam na sessão. Um formato ZIP editável com manifesto, `.por` e recursos permitiria restaurar uma sessão completa.
3. **Execução isolada:** o código roda na página principal. Um worker para lógica e uma ponte para gráficos/entrada reduziriam impacto de programas pesados sobre a IDE.
4. **Camada gráfica:** o registro das operações resolve capturas fora da tela. Consolidar toda a renderização em uma fila única evitaria desenhar operações duas vezes ao capturar imagens e aproximaria mais o comportamento do Java.
5. **Desktop:** assinatura digital, ícone/nome configuráveis, progresso detalhado e builds para macOS/Linux. A geração direta atual é Windows x64 e local.
6. **Dependências de empacotamento:** a auditoria não apontou problemas nas dependências de produção; Electron Builder trouxe oito avisos moderados transitivos nas ferramentas de desenvolvimento. Acompanhar atualizações antes de distribuir o serviço de build para outros usuários.

## Validação

Build de produção; abertura do HTML via `file://`; execução sem servidor; imagem incorporada com acesso de rede bloqueado; gravação e recuperação de arquivos após recarregar; download pelo menu; largura mobile. Não foi executada a suíte de testes do projeto Java.
