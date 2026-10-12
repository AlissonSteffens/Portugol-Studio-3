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
