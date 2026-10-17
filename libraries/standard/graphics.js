export function installGraphicsLibrary(runtime) {
  const self = runtime;
  // ==================== BIBLIOTECA GRAFICOS ====================
  runtime.Graficos = {
      // Constantes de Cores
      COR_PRETO: 0x000000,
      COR_BRANCO: 0xFFFFFF,
      COR_AZUL: 0x0000FF,
      COR_VERDE: 0x00FF00,
      COR_VERMELHO: 0xFF0000,
      COR_AMARELO: 0xFFFF00,

      GRADIENTE_INFERIOR_DIREITO: 1,
      GRADIENTE_SUPERIOR_DIREITO: 2,
      GRADIENTE_INFERIOR_ESQUERDO: 3,
      GRADIENTE_SUPERIOR_ESQUERDO: 4,

      iniciar_modo_grafico(redimensionavel = true) {
          // Prepara o canvas
          if (self.canvas) {
              self.canvas.width = self.bufferWidth;
              self.canvas.height = self.bufferHeight;
          }
      },

      encerrar_modo_grafico() {
          // Reset do modo gráfico
      },

      definir_dimensoes_janela(largura, altura) {
          self.bufferWidth = Math.max(10, Math.floor(largura));
          self.bufferHeight = Math.max(10, Math.floor(altura));
          self.bufferCanvas.width = self.bufferWidth;
          self.bufferCanvas.height = self.bufferHeight;
          self.__drawing.clear();
          if (self.canvas) {
              self.canvas.width = self.bufferWidth;
              self.canvas.height = self.bufferHeight;
          }
          self.bCtx.fillStyle = self.currentColor;
          self.bCtx.strokeStyle = self.currentColor;
          self._updateFont();

          if (self.options.onResize) {
              self.options.onResize(self.bufferWidth, self.bufferHeight);
          }
      },

      definir_titulo_janela(titulo) {
          if (self.options.onTitleChange) {
              self.options.onTitleChange(titulo);
          }
      },

      entrar_modo_tela_cheia() {
          self.Graficos.definir_dimensoes_janela(800, 600);
      },

      criar_cor(r, g, b, a = 255) {
          return ((a & 0xFF) << 24) | ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
      },

      definir_cor(cor) {
          self.currentColor = self._colorToCss(cor);
          self.bCtx.fillStyle = self.currentColor;
          self.bCtx.strokeStyle = self.currentColor;
      },

      definir_opacidade(opacidade) {
          self.currentOpacity = Math.max(0, Math.min(255, opacidade));
          self.currentColor = self._colorToCss(self.currentColor);
          self.bCtx.fillStyle = self.currentColor;
          self.bCtx.strokeStyle = self.currentColor;
      },

      definir_gradiente(tipo, cor1, cor2) {
          let grad;
          const w = self.bufferWidth;
          const h = self.bufferHeight;
          const c1 = self._colorToCss(cor1);
          const c2 = self._colorToCss(cor2);

          if (tipo === 1) { // INFERIOR_DIREITO
              grad = self.bCtx.createLinearGradient(0, 0, w, h);
          } else if (tipo === 2) { // SUPERIOR_DIREITO
              grad = self.bCtx.createLinearGradient(0, h, w, 0);
          } else if (tipo === 3) { // INFERIOR_ESQUERDO
              grad = self.bCtx.createLinearGradient(w, 0, 0, h);
          } else { // SUPERIOR_ESQUERDO
              grad = self.bCtx.createLinearGradient(w, h, 0, 0);
          }
          grad.addColorStop(0, c1);
          grad.addColorStop(1, c2);
          self.currentColor = grad;
          self.bCtx.fillStyle = grad;
          self.bCtx.strokeStyle = grad;
      },

      limpar() {
          self.bCtx.fillRect(0, 0, self.__drawingWidth || self.bufferWidth, self.__drawingHeight || self.bufferHeight);
      },

      async renderizar() {
          if (self.__aborted) throw new Error("EXECUCAO_INTERROMPIDA");
          // Transfere o buffer para o canvas na tela
          if (self.canvas && self.ctx) {
              self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
              self.ctx.drawImage(self.bufferCanvas, 0, 0, self.canvas.width, self.canvas.height);
          }
          (self.__mainDrawing || self.__drawing).clear();
          // Aguarda o próximo frame de animação
          await self.waitForFrame();
          if (self.__aborted) throw new Error("EXECUCAO_INTERROMPIDA");
      },

      desenhar_retangulo(x, y, largura, altura, arredondar, preencher) {
          self.bCtx.beginPath();
          if (arredondar) {
              const radius = Math.min(10, largura / 4, altura / 4);
              self.bCtx.roundRect(x, y, largura, altura, radius);
          } else {
              self.bCtx.rect(x, y, largura, altura);
          }
          if (preencher) {
              self.bCtx.fill();
          } else {
              self.bCtx.stroke();
          }
      },

      desenhar_elipse(x, y, largura, altura, preencher) {
          self.bCtx.beginPath();
          const rx = largura / 2;
          const ry = altura / 2;
          const cx = x + rx;
          const cy = y + ry;
          self.bCtx.ellipse(cx, cy, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2);
          if (preencher) {
              self.bCtx.fill();
          } else {
              self.bCtx.stroke();
          }
      },

      desenhar_linha(x1, y1, x2, y2) {
          self.bCtx.beginPath();
          self.bCtx.moveTo(x1, y1);
          self.bCtx.lineTo(x2, y2);
          self.bCtx.stroke();
      },

      desenhar_ponto(x, y) {
          self.bCtx.fillRect(x, y, 1, 1);
      },

      desenhar_poligono(pontos, preencher) {
          if (!pontos || pontos.length < 3) return;
          self.bCtx.beginPath();
          self.bCtx.moveTo(pontos[0][0], pontos[0][1]);
          for (let i = 1; i < pontos.length; i++) {
              self.bCtx.lineTo(pontos[i][0], pontos[i][1]);
          }
          self.bCtx.closePath();
          if (preencher) {
              self.bCtx.fill();
          } else {
              self.bCtx.stroke();
          }
      },

      definir_tamanho_texto(tamanho) {
          self.fontSize = Math.max(6, Math.floor(tamanho));
          self._updateFont();
      },

      definir_fonte_texto(nome) {
          self.fontFamily = nome;
          self._updateFont();
      },

      definir_estilo_texto(italico, negrito, sublinhado) {
          self.fontItalic = !!italico;
          self.fontBold = !!negrito;
          self.fontUnderline = !!sublinhado;
          self._updateFont();
      },

      largura_texto(texto) {
          self._updateFont();
          return Math.ceil(self.bCtx.measureText(String(texto)).width);
      },

      altura_texto(texto) {
          return self.fontSize;
      },

      desenhar_texto(x, y, texto) {
          self._updateFont();
          self.bCtx.fillText(String(texto), x, y);
      },

      largura_janela() {
          return self.bufferWidth;
      },

      altura_janela() {
          return self.bufferHeight;
      },

      largura_tela() {
          return self.bufferWidth;
      },

      altura_tela() {
          return self.bufferHeight;
      },

      async carregar_imagem(caminho) {
          if (!self.options.files) throw new Error('Repositório de arquivos indisponível.');
          const image = await self.options.files.image(caminho);
          if (self.__aborted) throw new Error('EXECUCAO_INTERROMPIDA');
          const id = self.__nextImageId++;
          self.__images.set(id, image);
          return id;
      },

      desenhar_imagem(x, y, endereco) {
          const img = self.__images.get(endereco);
          if (img) {
              self.bCtx.drawImage(img, x, y);
          }
      },

      desenhar_porcao_imagem(x, y, sx, sy, sw, sh, endereco) {
          const img = self.__images.get(endereco);
          if (img) {
              self.bCtx.drawImage(img, sx, sy, sw, sh, x, y, sw, sh);
          }
      },

      renderizar_imagem(largura, altura) {
          const id = self.__nextImageId++;
          const snapCanvas = document.createElement('canvas');
          snapCanvas.width = largura;
          snapCanvas.height = altura;
          const sctx = snapCanvas.getContext('2d');
          self.__drawing.render(sctx);
          self.__drawing.clear();
          // A captura consome os desenhos sem alterar o conteúdo já exibido.
          const buffer = self.__rawBCtx;
          buffer.save();
          buffer.resetTransform(); buffer.globalAlpha = 1; buffer.globalCompositeOperation = 'source-over';
          buffer.clearRect(0, 0, self.bufferWidth, self.bufferHeight);
          if (self.canvas) buffer.drawImage(self.canvas, 0, 0);
          buffer.restore();
          self.__images.set(id, snapCanvas);
          return id;
      },

      liberar_imagem(endereco) {
          self.__images.delete(endereco);
      },

      largura_imagem(endereco) {
          const image = self.__images.get(endereco);
          if (!image) throw new Error('Imagem não encontrada.');
          return image.width;
      },

      altura_imagem(endereco) {
          const image = self.__images.get(endereco);
          if (!image) throw new Error('Imagem não encontrada.');
          return image.height;
      },

      async salvar_imagem(endereco, caminho) {
          const image = self.__images.get(endereco);
          if (!image) throw new Error('Imagem não encontrada.');
          if (!self.options.files) throw new Error('Repositório indisponível.');
          const output = document.createElement('canvas');
          output.width = image.width; output.height = image.height;
          output.getContext('2d').drawImage(image, 0, 0);
          const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
          if (!blob) throw new Error('Não foi possível salvar a imagem.');
          await self.options.files.writeBlob(caminho, blob);
      }
  };

  runtime._updateFont = () => {
      let style = '';
      if (self.fontItalic) style += 'italic ';
      if (self.fontBold) style += 'bold ';
      self.bCtx.font = `${style}${self.fontSize}px ${self.fontFamily}`;
      self.bCtx.textBaseline = 'top';
  };
}
