const parameter = (name, description) => ({ name, description, type: 'inteiro', dimensions: 0 });
const method = (type, description, parameters) => ({ type, description, available: true, parameters, returns: '' });
export const webGraphicsContracts = {
  criar_buffer: method('inteiro', 'Cria um buffer gráfico reutilizável fora da tela e retorna seu endereço.', [parameter('largura', 'Largura em pixels.'), parameter('altura', 'Altura em pixels.')]),
  usar_buffer: method('vazio', 'Direciona os desenhos para um buffer; use 0 para voltar à janela gráfica.', [parameter('endereco', 'Endereço do buffer, ou 0 para a janela.')]),
  desenhar_buffer: method('vazio', 'Desenha o conteúdo de um buffer no destino atual, sem recriar a imagem.', [parameter('x', 'Posição horizontal.'), parameter('y', 'Posição vertical.'), parameter('endereco', 'Endereço do buffer de origem.')]),
  limpar_buffer: method('vazio', 'Apaga um buffer para transparente, preservando seu tamanho.', [parameter('endereco', 'Endereço do buffer; 0 representa a janela.')]),
  liberar_buffer: method('vazio', 'Libera a memória de um buffer criado com criar_buffer.', [parameter('endereco', 'Endereço do buffer.')]),
};
export const webMouseContracts = {
  capturar_cursor: method('vazio', 'Solicita controle livre do mouse. O próximo clique no canvas captura o cursor; Esc o libera.', []),
  soltar_cursor: method('vazio', 'Libera o mouse para voltar a usar o editor.', []),
  cursor_capturado: method('logico', 'Informa se o cursor está capturado pela janela gráfica.', []),
  movimento_x: method('inteiro', 'Retorna e consome o movimento horizontal acumulado do mouse capturado.', []),
  movimento_y: method('inteiro', 'Retorna e consome o movimento vertical acumulado do mouse capturado.', []),
};
const browserMethod = (type, description, returns) => ({ type, description, returns, available: true, parameters: [] });
export const webBrowserContracts = {
  obter_nome: browserMethod('cadeia', 'Identifica a família do navegador pelas informações públicas disponíveis. A identificação é aproximada e pode ser alterada pelo navegador.', 'Chrome, Chromium, Edge, Firefox, Safari, Opera, Samsung Internet ou Desconhecido.'),
  obter_sistema_operacional: browserMethod('cadeia', 'Identifica o sistema operacional informado pelo navegador, sem consultar sua versão.', 'Android, iOS, iPadOS, Windows, macOS, Linux, ChromeOS, Windows Phone ou Desconhecido.'),
  eh_celular: browserMethod('logico', 'Estima se o dispositivo é um celular. Não usa a largura da janela; tablets têm uma consulta separada. Para adaptar controles, consulte suporta_toque e possui_mouse.', 'verdadeiro para um celular identificado; falso para tablet, computador ou dispositivo não identificado.'),
  eh_tablet: browserMethod('logico', 'Estima se o dispositivo é um tablet, incluindo iPadOS com identificação de computador e tablets Android.', 'verdadeiro para um tablet identificado; falso nos demais casos.'),
  suporta_toque: browserMethod('logico', 'Consulta o suporte a pontos de toque ou a um apontador de baixa precisão, como uma tela sensível ao toque. Pode ser verdadeiro em computadores.', 'verdadeiro quando o navegador informa suporte a toque ou apontador de baixa precisão.'),
  possui_mouse: browserMethod('logico', 'Consulta se há um apontador de alta precisão, como mouse, trackpad ou caneta. Pode ser verdadeiro junto com suporta_toque.', 'verdadeiro quando a consulta any-pointer: fine corresponde ao ambiente atual.'),
  largura_janela: browserMethod('inteiro', 'Consulta a largura interna da janela que exibe a execução, em pixels CSS. Atualiza após redimensionar e ao abrir o gráfico em outra aba. É diferente da largura do canvas.', 'Largura atual da janela; 0 quando indisponível.'),
  altura_janela: browserMethod('inteiro', 'Consulta a altura interna da janela que exibe a execução, em pixels CSS. É diferente da altura do canvas.', 'Altura atual da janela; 0 quando indisponível.'),
  largura_tela: browserMethod('inteiro', 'Consulta a largura da tela informada pelo navegador, em pixels CSS. Não representa a resolução física do monitor.', 'Largura informada da tela; 0 quando indisponível.'),
  altura_tela: browserMethod('inteiro', 'Consulta a altura da tela informada pelo navegador, em pixels CSS.', 'Altura informada da tela; 0 quando indisponível.'),
  densidade_pixels: browserMethod('real', 'Consulta a proporção entre pixels físicos e pixels CSS (devicePixelRatio). Pode mudar com zoom ou troca de monitor.', 'Proporção positiva, como 1.0 ou 2.0; 1.0 quando indisponível.'),
  obter_idioma: browserMethod('cadeia', 'Consulta o idioma preferido informado pelo navegador.', 'Etiqueta de idioma, como pt-BR ou en-US; cadeia vazia quando indisponível.'),
  esta_online: browserMethod('logico', 'Consulta o sinal navigator.onLine. Indica apenas o estado de rede informado pelo navegador e não garante acesso à Internet ou a um site específico.', 'verdadeiro se o navegador informa estar online; falso se estiver offline ou não informar o estado.'),
  obter_orientacao: browserMethod('cadeia', 'Compara a largura e a altura atuais da janela. A orientação da janela pode diferir da orientação física da tela.', 'paisagem se a largura for maior; retrato nos demais formatos válidos (incluindo quadrado); Desconhecido sem dimensões.'),
};
