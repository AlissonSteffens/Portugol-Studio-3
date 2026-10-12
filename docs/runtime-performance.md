# Buffers e execução do runtime

Os exemplos de blocos usam buffers gráficos reutilizáveis para o cenário e a interface. O 2D redesenha o terreno somente quando um bloco muda. O 3D também mantém um buffer de cubos e faces expostas, reconstruído somente após editar o mundo, e reutiliza as matrizes de projeção de cada face.

## API gráfica web

```portugol
inteiro fundo = g.criar_buffer(900, 620)
g.usar_buffer(fundo)
// Desenhar o cenário uma vez.
g.usar_buffer(0) // Voltar ao buffer da janela.
g.desenhar_buffer(0, 0, fundo)
g.renderizar()
// Quando o buffer não for mais necessário:
g.liberar_buffer(fundo)
```

`limpar_buffer(endereco)` apaga para transparente, permitindo camadas de interface. `desenhar_buffer` respeita opacidade e rotação. Os endereços e tamanhos são validados; liberar ou encerrar a execução recupera a memória. O buffer 0 representa a janela gráfica. Essas funções são extensões do runtime web e aparecem na conclusão de código e nos tooltips.

## Mouse em primeira pessoa

`Mouse.capturar_cursor()` habilita a captura no próximo clique do usuário no canvas. Esse primeiro clique ativa a câmera e não minera um bloco. `movimento_x()` e `movimento_y()` retornam e consomem os deslocamentos acumulados, permitindo olhar continuamente sem chegar à borda da tela. `cursor_capturado()` informa o estado e `soltar_cursor()` devolve o mouse ao editor. Esc libera a captura sem encerrar o jogo; uma segunda ação de Esc, com o cursor livre, encerra a execução. A captura acompanha a aba gráfica destacada e é liberada ao parar ou depurar.

## Caminhos de execução

- Bibliotecas síncronas auditadas não criam promessas para cada operação; I/O e métodos desconhecidos mantêm o caminho assíncrono e a tradução dos erros.
- Funções sem laços, recursão ou chamadas assíncronas possuem uma versão síncrona. Ao depurar ou ativar pontos de parada, as chamadas usam a versão instrumentada.
- Checkpoints só suspendem a execução quando existe uma pausa efetiva. Guardas de laço continuam cedendo tempo ao navegador e verificando interrupção, limite de passos e profundidade.
- A interface amostra variáveis a cada 80 ms. Pausas, entrada por `leia()` e o encerramento da função principal forçam a coleta, preservando valores atuais e finais.
- Leituras de matrizes dispensam objetos de referência temporários e validação duplicada no proxy. Escritas e parâmetros por referência preservam conversões, limites e localização dos erros.
- O contexto gráfico reutiliza wrappers de métodos e evita salvar/restaurar estado quando opacidade e rotação são padrão.

## Medições

Teste reproduzível com 12 quadros e entrada/tempo simulados, sem esperar a atualização do monitor:

| Exemplo | Antes | Depois | Coletas de variáveis antes → depois |
| --- | ---: | ---: | ---: |
| Blocos 2D | 762 ms | 63 ms | 160.083 → 1 |
| Blocos 3D | 23.209 ms | 517 ms | 1.188.652 → 5 |

Comando: `node scripts/benchmark-runtime.js reports/runtime-buffered.json`. A variável `BENCHMARK_FRAMES` permite alterar a quantidade de quadros. Esse teste mede custo de execução e desenho; os tempos não são uma medição de FPS.

Na aplicação completa, em Chromium headless a 1440 × 1000, uma amostra de 1,5 segundo por cenário mediu 59,8 FPS no 2D, 59,7 FPS no 3D parado e 56,5 FPS movendo a câmera. Esses resultados variam com máquina, navegador e resolução. Para reproduzir, inicie o servidor após o build e execute `node scripts/benchmark-browser.js reports/browser-performance.json`; `PORTUGOL_URL` permite indicar outro endereço.

Validação atual: 135 testes de core e 29 testes no navegador, incluindo remoção/colocação de blocos, movimento e colisão do personagem 2D, câmera pelo mouse, picareta animada, buffers transparentes, depuração, referências, limites, entrada e captura de mouse na aba gráfica destacada. As medições acima registram a etapa de otimização anterior à adição dos personagens.
