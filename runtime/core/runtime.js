import { installMouseCapture } from './mouse-capture.js';
import { installNavigatorLibrary } from './navigator-library.js';
import { installGraphicsBuffers } from './graphics-buffers.js';
import { presentationMethods } from './presentation.js';
import { installExtendedLibraries } from './extended-libraries.js';
import { runtimeError } from './diagnostics.js';
/**
 * Portugol Studio Web - Runtime Engine
 * Implementação completa das bibliotecas do Portugol Studio:
 * Graficos, Matematica, Util, Teclado, Mouse, Tipos, Calendario, Texto e E/S.
 */

import { valueMethods } from './runtime-values.js';
import { installBrowserLibraries } from './browser-libraries.js';
import { recordingContext } from './recording-context.js';
'use strict';

    class PortugolRuntime {
        constructor(canvasElement, consoleElement, options = {}) {
            this.canvas = canvasElement;
            this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
            this.consoleEl = consoleElement;
            this.options = options;

            this.__aborted = false;
            this.__startTime = performance.now();
            this.__keyStates = new Map();
            this.__lastKey = null;
            this.__keyWaitResolvers = [];
            this.__inputResolvers = [];

            this.__mouseX = 0;
            this.__mouseY = 0;
            this.__mouseButtons = [false, false, false]; // [esquerdo, direito, meio]

            // Offscreen Buffer para Double Buffering
            const createOffscreen = () => {
                if (typeof document !== 'undefined') {
                    return document.createElement('canvas');
                }
                return {
                    width: 800,
                    height: 600,
                    getContext: () => ({
                        save: () => {}, restore: () => {}, resetTransform: () => {}, translate: () => {}, rotate: () => {},
                        clearRect: () => {},
                        drawImage: () => {},
                        fillRect: () => {},
                        strokeRect: () => {},
                        beginPath: () => {},
                        rect: () => {},
                        roundRect: () => {},
                        ellipse: () => {},
                        moveTo: () => {},
                        lineTo: () => {},
                        fill: () => {},
                        stroke: () => {},
                        closePath: () => {},
                        fillText: () => {},
                        measureText: (txt) => ({ width: (txt || '').length * 8 }),
                        createLinearGradient: () => ({ addColorStop: () => {} })
                    })
                };
            };
            this.createCanvas = createOffscreen;
            this.bufferCanvas = createOffscreen();
            this.bufferWidth = 800;
            this.bufferHeight = 600;
            this.bufferCanvas.width = this.bufferWidth;
            this.bufferCanvas.height = this.bufferHeight;
            this.__rawBCtx = this.bufferCanvas.getContext('2d');
            this.__drawing = recordingContext(this.__rawBCtx);
            this.bCtx = this.__drawing.context;

            // Configuração gráfica padrão
            this.currentColor = 'rgba(255, 255, 255, 1)';
            this.currentOpacity = 255;
            this.fontSize = 14;
            this.fontFamily = 'monospace';
            this.fontBold = false;
            this.fontItalic = false;
            this.fontUnderline = false;

            // Gerenciador de imagens procedurais/carregadas
            this.__images = new Map();
            this.__nextImageId = 1;

            // Sistema de Arquivos Virtual (VFS)
            this.__vfs = options.files?.files || Object.create(null);
            this.__fileDescriptors = new Map();
            this.__nextFileHandle = 1;

            // Inicializa event listeners
            this._setupEventListeners();
            this._setupLibraries();
            installBrowserLibraries(this);
            installExtendedLibraries(this);
            installGraphicsBuffers(this);
            installMouseCapture(this);
            installNavigatorLibrary(this);
        }

        abort() {
            this.__aborted = true;
            this.__releaseMouseCapture?.();
            this.debugger?.abort();
            for (const pending of this.__presentationWaits || []) pending.abort();
            this.__networkController?.abort();
            for (const controller of this.__serviceRequests || []) controller.abort();
            while (this.__keyWaitResolvers.length > 0) {
                const resolve = this.__keyWaitResolvers.shift();
                resolve(0);
            }
            while (this.__inputResolvers && this.__inputResolvers.length > 0) {
                const item = this.__inputResolvers.shift();
                if (item && item.reject) item.reject(new Error("EXECUCAO_INTERROMPIDA"));
            }
        }

        _setupEventListeners() {
            if (typeof window === 'undefined') return;

            this._onKeyDown = (e) => {
                if (e.code === 'Escape' && this.canvas?.ownerDocument.pointerLockElement === this.canvas) {
                    this.__ignoreEscapeUntil = performance.now() + 200;
                    this.__releaseMouseCapture?.(false);
                    return;
                }
                if (e.code === 'Escape' && this.__ignoreEscapeUntil > performance.now()) return;
                const code = this._mapKeyCode(e);
                this.__keyStates.set(code, true);
                this.__lastKey = code;

                // Notifica eventuais 'ler_tecla' em espera
                while (this.__keyWaitResolvers.length > 0) {
                    const resolve = this.__keyWaitResolvers.shift();
                    resolve(code);
                }

                // Evita scroll da tela em setas ou espaço quando estiver no foco do canvas
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                    if (this.canvas && (this.canvas.ownerDocument.activeElement === this.canvas)) {
                        e.preventDefault();
                    }
                }
            };

            this._onKeyUp = (e) => {
                const code = this._mapKeyCode(e);
                this.__keyStates.set(code, false);
            };

            this._onMouseMove = (e) => {
                if (!this.canvas || this.canvas.ownerDocument.pointerLockElement === this.canvas) return;
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.bufferWidth / rect.width;
                const scaleY = this.bufferHeight / rect.height;
                this.__mouseX = Math.floor((e.clientX - rect.left) * scaleX);
                this.__mouseY = Math.floor((e.clientY - rect.top) * scaleY);
            };

            this._onMouseDown = (e) => {
                if (this.__requestMouseCapture?.()) return;
                const btnIdx = e.button === 0 ? 0 : (e.button === 2 ? 1 : 2);
                this.__mouseButtons[btnIdx] = true;
            };

            this._onMouseUp = (e) => {
                const btnIdx = e.button === 0 ? 0 : (e.button === 2 ? 1 : 2);
                this.__mouseButtons[btnIdx] = false;
            };

            this._onContextMenu = (e) => {
                // Impede menu de contexto do botão direito no canvas
                e.preventDefault();
            };

            this._onRelativeMouseMove = (e) => {
                if (this.canvas?.ownerDocument.pointerLockElement !== this.canvas || (e.target.ownerDocument || e.target) !== this.canvas.ownerDocument) return;
                this.__mouseDeltaX = (this.__mouseDeltaX || 0) + (e.movementX || 0);
                this.__mouseDeltaY = (this.__mouseDeltaY || 0) + (e.movementY || 0);
            };
            this._onPointerLockChange = (e) => {
                if (e.target !== this.canvas?.ownerDocument) return;
                const captured = this.canvas.ownerDocument.pointerLockElement === this.canvas;
                if (this.__wasCaptured && !captured) this.__ignoreEscapeUntil = performance.now() + 200;
                this.__wasCaptured = captured;
                this.__capturePending = false; this.__mouseDeltaX = 0; this.__mouseDeltaY = 0;
                this.__mouseButtons.fill(false); this.__keyStates.clear();
            };
            this._onPointerLockError = () => { this.__capturePending = false; };
            this.__inputWindows = new Set();
            this.bindInputWindow(window);
            if (this.canvas?.ownerDocument.defaultView !== window) this.bindInputWindow(this.canvas.ownerDocument.defaultView);

            if (this.canvas) {
                this.canvas.addEventListener('mousemove', this._onMouseMove);
                this.canvas.addEventListener('mousedown', this._onMouseDown);

                this.canvas.addEventListener('contextmenu', this._onContextMenu);
            }
        }

        destroy() {
            this.abort();
            this.__disposeMedia?.();
            this.__disposeBuffers?.();
            if (typeof window !== 'undefined') {
                for (const target of this.__inputWindows) this.unbindInputWindow(target);
                if (this.canvas) {
                    this.canvas.removeEventListener('mousemove', this._onMouseMove);
                    this.canvas.removeEventListener('mousedown', this._onMouseDown);
                    this.canvas.removeEventListener('contextmenu', this._onContextMenu);
                }
            }
        }

        bindInputWindow(target) {
            if (!target || this.__inputWindows?.has(target)) return;
            this.__inputWindows.add(target);
            target.addEventListener('keydown', this._onKeyDown);
            target.addEventListener('keyup', this._onKeyUp);
            target.addEventListener('mouseup', this._onMouseUp);
            this._onBlur ||= () => { this.__keyStates.clear(); this.__mouseButtons.fill(false); this.__mouseDeltaX = 0; this.__mouseDeltaY = 0; };
            target.addEventListener('blur', this._onBlur);
            target.document.addEventListener('mousemove', this._onRelativeMouseMove);
            target.document.addEventListener('pointerlockchange', this._onPointerLockChange);
            target.document.addEventListener('pointerlockerror', this._onPointerLockError);
        }

        unbindInputWindow(target) {
            target.removeEventListener('keydown', this._onKeyDown);
            target.removeEventListener('keyup', this._onKeyUp);
            target.removeEventListener('mouseup', this._onMouseUp);
            target.removeEventListener('blur', this._onBlur);
            target.document.removeEventListener('mousemove', this._onRelativeMouseMove);
            target.document.removeEventListener('pointerlockchange', this._onPointerLockChange);
            target.document.removeEventListener('pointerlockerror', this._onPointerLockError);
            this.__inputWindows.delete(target);
            this._onBlur();
        }

        _mapKeyCode(e) {
            // Teclado Portugol Studio Constants Mapping (Java KeyEvent)
            const map = {
                'Enter': 10,
                'Escape': 27,
                'Space': 32,
                'ArrowLeft': 37,
                'ArrowUp': 38,
                'ArrowRight': 39,
                'ArrowDown': 40,
                'ShiftLeft': 16,
                'ShiftRight': 16,
                'ControlLeft': 17,
                'ControlRight': 17,
                'AltLeft': 18,
                'AltRight': 18,
                'Tab': 9,
                'Backspace': 8,
                'KeyA': 65, 'KeyB': 66, 'KeyC': 67, 'KeyD': 68, 'KeyE': 69,
                'KeyF': 70, 'KeyG': 71, 'KeyH': 72, 'KeyI': 73, 'KeyJ': 74,
                'KeyK': 75, 'KeyL': 76, 'KeyM': 77, 'KeyN': 78, 'KeyO': 79,
                'KeyP': 80, 'KeyQ': 81, 'KeyR': 82, 'KeyS': 83, 'KeyT': 84,
                'KeyU': 85, 'KeyV': 86, 'KeyW': 87, 'KeyX': 88, 'KeyY': 89,
                'KeyZ': 90,
                'Digit0': 48, 'Digit1': 49, 'Digit2': 50, 'Digit3': 51, 'Digit4': 52,
                'Digit5': 53, 'Digit6': 54, 'Digit7': 55, 'Digit8': 56, 'Digit9': 57,
                'Minus': 45, 'Equal': 61, 'Delete': 127, 'PageUp': 33, 'PageDown': 34
            };
            return map[e.code] || e.keyCode || 0;
        }

        _colorToCss(val) {
            if (typeof val === 'string') return val;
            val = val | 0; // força 32 bits
            let r = (val >>> 16) & 0xFF;
            let g = (val >>> 8) & 0xFF;
            let b = val & 0xFF;

            // Java's Color(int) ignores the upper byte; opacity is a separate setting.
            return `rgba(${r}, ${g}, ${b}, 1)`;
        }

        _setupLibraries() {
            const self = this;

            // ==================== BIBLIOTECA GRAFICOS ====================
            this.Graficos = {
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

            this._updateFont = () => {
                let style = '';
                if (self.fontItalic) style += 'italic ';
                if (self.fontBold) style += 'bold ';
                self.bCtx.font = `${style}${self.fontSize}px ${self.fontFamily}`;
                self.bCtx.textBaseline = 'top';
            };

            // ==================== BIBLIOTECA MATEMATICA ====================
            this.Matematica = {
                PI: Math.PI,
                seno(ang) { return Math.sin(ang); },
                cosseno(ang) { return Math.cos(ang); },
                tangente(ang) { return Math.tan(ang); },
                raiz(rad, ind) { return Math.pow(rad, 1.0 / ind); },
                potencia(base, exp) { return Math.pow(base, exp); },
                arredondar(num, casas) {
                    const factor = Math.pow(10, casas);
                    return Math.round(num * factor) / factor;
                },
                valor_absoluto(n) { return Math.abs(n); },
                maior_numero(a, b) { return Math.max(a, b); },
                menor_numero(a, b) { return Math.min(a, b); }
            };

            // ==================== BIBLIOTECA UTIL ====================
            this.Util = {
                async aguarde(ms) {
                    if (self.__aborted) throw new Error("EXECUCAO_INTERROMPIDA");
                    await self.waitForDelay(ms);
                    if (self.__aborted) throw new Error("EXECUCAO_INTERROMPIDA");
                },
                tempo_decorrido() {
                    return Math.floor(performance.now() - self.__startTime);
                },
                sorteia(min, max) {
                    if (min > max) throw runtimeError('ErroExecucaoBiblioteca', `O valor mínimo (${min}) é maior do que o valor máximo (${max}).`);
                    if (min === max) throw runtimeError('ErroExecucaoBiblioteca', `Os valores mínimo e máximo são iguais: ${min}.`);
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                },
                numero_elementos(vetor) {
                    return Array.isArray(vetor) ? vetor.length : 0;
                },
                numero_linhas(matriz) {
                    return Array.isArray(matriz) ? matriz.length : 0;
                },
                numero_colunas(matriz) {
                    return (Array.isArray(matriz) && matriz[0] && Array.isArray(matriz[0])) ? matriz[0].length : 0;
                },
                obter_diretorio_usuario() {
                    return "/home/usuario";
                }
            };

            // ==================== BIBLIOTECA TECLADO ====================
            this.Teclado = {
                TECLA_ENTER: 10,
                TECLA_BACKSPACE: 8,
                TECLA_TAB: 9,
                TECLA_SHIFT: 16,
                TECLA_CONTROL: 17,
                TECLA_ALT: 18,
                TECLA_ESC: 27,
                TECLA_ESPACO: 32,
                TECLA_SETA_ESQUERDA: 37,
                TECLA_SETA_ACIMA: 38,
                TECLA_SETA_DIREITA: 39,
                TECLA_SETA_ABAIXO: 40,
                TECLA_MENOS: 45,
                TECLA_IGUAL: 61,
                TECLA_ADICAO: 107,
                TECLA_SUBTRACAO: 109,
                TECLA_A: 65, TECLA_B: 66, TECLA_C: 67, TECLA_D: 68, TECLA_E: 69,
                TECLA_F: 70, TECLA_G: 71, TECLA_H: 72, TECLA_I: 73, TECLA_J: 74,
                TECLA_K: 75, TECLA_L: 76, TECLA_M: 77, TECLA_N: 78, TECLA_O: 79,
                TECLA_P: 80, TECLA_Q: 81, TECLA_R: 82, TECLA_S: 83, TECLA_T: 84,
                TECLA_U: 85, TECLA_V: 86, TECLA_W: 87, TECLA_X: 88, TECLA_Y: 89,
                TECLA_Z: 90,
                TECLA_0: 48, TECLA_1: 49, TECLA_2: 50, TECLA_3: 51, TECLA_4: 52,
                TECLA_5: 53, TECLA_6: 54, TECLA_7: 55, TECLA_8: 56, TECLA_9: 57,

                tecla_pressionada(codigo) {
                    if (codigo === 10 && self.__keyStates.get(13)) return true;
                    return !!self.__keyStates.get(codigo);
                },

                alguma_tecla_pressionada() {
                    for (let [, pressed] of self.__keyStates) {
                        if (pressed) return true;
                    }
                    return false;
                },

                caracter_tecla(tecla) {
                    if (tecla >= 65 && tecla <= 90) return String.fromCharCode(tecla).toLowerCase();
                    if (tecla >= 48 && tecla <= 57) return String.fromCharCode(tecla);
                    if (tecla === 32) return ' ';
                    return '';
                },

                async ler_tecla() {
                    return new Promise(resolve => {
                        self.__keyWaitResolvers.push(resolve);
                    });
                }
            };

            // ==================== BIBLIOTECA MOUSE ====================
            this.Mouse = {
                BOTAO_ESQUERDO: 0,
                BOTAO_DIREITO: 1,
                BOTAO_MEIO: 2,

                posicao_x() {
                    return self.__mouseX;
                },

                posicao_y() {
                    return self.__mouseY;
                },

                botao_pressionado(botao) {
                    return !!self.__mouseButtons[botao];
                },

                algum_botao_pressionado() {
                    return self.__mouseButtons.some(b => !!b);
                },

                ler_botao() {
                    return self.__mouseButtons[0] ? 0 : (self.__mouseButtons[1] ? 1 : (self.__mouseButtons[2] ? 2 : -1));
                }
            };

            // ==================== BIBLIOTECA TIPOS ====================
            this.Tipos = {
                real_para_inteiro(v) { return Math.trunc(v); },
                inteiro_para_real(v) { return Number(v); },
                inteiro_para_cadeia(v, base = 10) { return Number(v).toString(base); },
                real_para_cadeia(v) { return String(v); },
                cadeia_para_inteiro(v, base = 10) { return parseInt(v, base); },
                cadeia_para_real(v) { return parseFloat(v); },
                cadeia_para_caracter(v) { return String(v)[0] || ''; },
                caracter_para_cadeia(v) { return String(v); },
                logico_para_cadeia(v) { return v ? 'verdadeiro' : 'falso'; },
                cadeia_e_inteiro(s, base = 10) { return !isNaN(parseInt(s, base)); },
                cadeia_e_real(s) { return !isNaN(parseFloat(s)); },
                caracter_e_logico(c) { return ['S', 's', 'N', 'n', 'V', 'v', 'F', 'f'].includes(c); },
                caracter_para_logico(c) { return ['S', 's', 'V', 'v'].includes(c); }
            };

            // ==================== BIBLIOTECA CALENDARIO ====================
            this.Calendario = {
                hora_atual(f24 = true) {
                    const h = new Date().getHours();
                    return f24 ? h : (h % 12 || 12);
                },
                minuto_atual() { return new Date().getMinutes(); },
                segundo_atual() { return new Date().getSeconds(); },
                milisegundo_atual() { return new Date().getMilliseconds(); },
                dia_mes_atual() { return new Date().getDate(); },
                dia_semana_atual() { return new Date().getDay() + 1; },
                mes_atual() { return new Date().getMonth() + 1; },
                ano_atual() { return new Date().getFullYear(); }
            };

            // ==================== BIBLIOTECA TEXTO ====================
            this.Texto = {
                numero_caracteres(s) { return String(s).length; },
                tamanho(s) { return String(s).length; },
                caixa_alta(s) { return String(s).toUpperCase(); },
                caixa_baixa(s) { return String(s).toLowerCase(); },
                substituir(s, b, subst) { return String(s).split(b).join(subst); },
                preencher_a_esquerda(car, tam, s) { return String(s).padStart(tam, car); },
                preencher_a_direita(car, tam, s) { return String(s).padEnd(tam, car); },
                subtexto(s, ini, fim) { return String(s).substring(ini, fim); },
                extrair_subtexto(s, ini, fim) { return String(s).substring(ini, fim); },
                posicao_texto(busca, texto, inicio = 0) {
                    return String(texto).indexOf(String(busca), Math.max(0, inicio));
                },
                pesquisar_texto(busca, texto, inicio = 0) {
                    return String(texto).indexOf(String(busca), Math.max(0, inicio));
                },
                obter_caracter(s, pos) {
                    return String(s).charAt(pos) || '';
                }
            };

            // ==================== BIBLIOTECA ARQUIVOS (VIRTUAL FILE SYSTEM) ====================
            const normalizePath = self.options.files?.normalizePath || (p => String(p).replaceAll('\\', '/').replace(/^(\.\/)+/, ''));
            const persist = (path, content) => self.options.files?.write(path, content);
            const descriptor = (handle, writing = false) => {
                const desc = self.__fileDescriptors.get(handle);
                if (!desc?.aberto) throw new Error('Arquivo fechado ou identificador inválido.');
                if (writing && desc.modo === 0) throw new Error('Arquivo aberto somente para leitura.');
                if (!writing && desc.modo !== 0) throw new Error('Arquivo aberto somente para escrita.');
                return desc;
            };

            this.Arquivos = {
                MODO_LEITURA: 0,
                MODO_ESCRITA: 1,
                MODO_ACRESCENTAR: 2,

                abrir_arquivo(caminho, modo) {
                    const norm = normalizePath(caminho);
                    caminho = norm;
                    if (![0, 1, 2].includes(modo)) throw new Error('Modo de abertura inválido.');
                    if (modo === 0 && !(norm in self.__vfs)) throw new Error('Arquivo não encontrado: ' + norm);
                    const handle = self.__nextFileHandle++;
                    let content = '';

                    if (modo === 1) { // MODO_ESCRITA
                        content = '';
                        self.__vfs[caminho] = '';
                        self.__vfs[norm] = '';
                        persist(norm, '');
                    } else { // MODO_LEITURA ou MODO_ACRESCENTAR
                        content = self.__vfs[caminho] ?? self.__vfs[norm] ?? '';
                    }

                    if (modo === 2 && !(norm in self.__vfs)) { self.__vfs[norm] = ''; persist(norm, ''); }
                    const lines = content.length > 0 ? content.split(/\r?\n/) : [];

                    self.__fileDescriptors.set(handle, {
                        path: caminho,
                        normPath: norm,
                        modo: modo,
                        lines: lines,
                        pointer: 0,
                        aberto: true
                    });

                    return handle;
                },

                fechar_arquivo(endereco) {
                    if (self.__fileDescriptors.has(endereco)) {
                        const desc = self.__fileDescriptors.get(endereco);
                        desc.aberto = false;
                        self.__fileDescriptors.delete(endereco);
                    }
                },

                fim_arquivo(endereco) {
                    const desc = self.__fileDescriptors.get(endereco);
                    if (!desc || !desc.aberto) return true;
                    return desc.pointer >= desc.lines.length;
                },

                ler_linha(endereco) {
                    const desc = descriptor(endereco);
                    if (desc.pointer >= desc.lines.length) return '';
                    const line = desc.lines[desc.pointer];
                    desc.pointer++;
                    return line;
                },

                escrever_linha(linha, endereco) {
                    const desc = descriptor(endereco, true);
                    desc.lines.push(String(linha));
                    const newContent = desc.lines.join('\n');
                    self.__vfs[desc.path] = newContent;
                    self.__vfs[desc.normPath] = newContent;
                    persist(desc.normPath, newContent);
                },

                substituir_texto(caminho, texto_pesquisa, texto_substituto, onlyFirst = false) {
                    const norm = normalizePath(caminho);
                    caminho = norm;
                    let content = self.__vfs[caminho] ?? self.__vfs[norm] ?? '';
                    if (onlyFirst) {
                        content = content.replace(texto_pesquisa, texto_substituto);
                    } else {
                        content = content.split(texto_pesquisa).join(texto_substituto);
                    }
                    self.__vfs[caminho] = content;
                    self.__vfs[norm] = content;
                    persist(norm, content);
                },

                arquivo_existe(caminho) {
                    const norm = normalizePath(caminho);
                    return (caminho in self.__vfs) || (norm in self.__vfs);
                },

                apagar_arquivo(caminho) {
                    const norm = normalizePath(caminho);
                    delete self.__vfs[caminho];
                    delete self.__vfs[norm];
                    self.options.files?.remove(norm);
                },

                selecionar_arquivo(formatos, aceitar_todos) {
                    const selected = window.prompt('Informe o caminho de um arquivo do repositório:');
                    if (!selected) throw new Error('Seleção de arquivo cancelada.');
                    const path = normalizePath(selected);
                    if (!(path in self.__vfs)) throw new Error('Arquivo não encontrado: ' + path);
                    return path;
                },

                criar_pasta(caminho) { normalizePath(String(caminho).replace(/[\\/]+$/, '')); /* Pastas são prefixos dos arquivos. */ },

                listar_arquivos(caminho, vetor) {
                    if (Array.isArray(vetor)) {
                        const prefix = caminho && caminho !== '.' ? normalizePath(caminho) + '/' : '';
                        const files = Object.keys(self.__vfs).filter(path => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'));
                        for (let i = 0; i < vetor.length; i++) {
                            vetor[i] = files[i] || '';
                        }
                    }
                },

                listar_pastas(caminho, vetor) {
                    if (Array.isArray(vetor)) {
                        const prefix = caminho && caminho !== '.' ? normalizePath(caminho) + '/' : '';
                        const folders = [...new Set(Object.keys(self.__vfs).filter(p => p.startsWith(prefix) && p.slice(prefix.length).includes('/')).map(p => prefix + p.slice(prefix.length).split('/')[0]))];
                        for (let i = 0; i < vetor.length; i++) vetor[i] = folders[i] || '';
                    }
                }
            };

        }

        // ==================== FUNÇÕES NATIVAS PORTUGOL ====================
        async escreva(...args) {
            const formatted = args.map(arg => {
                if (typeof arg === 'boolean') return arg ? 'verdadeiro' : 'falso';
                if (arg === null || arg === undefined) return '';
                return String(arg);
            }).join('');

            if (this.consoleEl && typeof document !== 'undefined') {
                const span = document.createElement('span');
                span.textContent = formatted;
                this.consoleEl.appendChild(span);
                this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
            } else {
                console.log(formatted);
            }
        }

        limpa() {
            if (this.consoleEl) {
                this.consoleEl.textContent = '';
            }
        }

        _parseInput(val, type) {
            if (typeof val !== 'string') return val;
            if (type === 'cadeia') return val;
            if (type === 'caracter') {
                if (val.length !== 1) throw runtimeError('ErroValorEntradaInvalido', 'Digite exatamente um caracter.');
                return val;
            }
            val = val.trim();
            if (type === 'inteiro') {
                if (!/^[+-]?\d+$/.test(val) || !Number.isSafeInteger(Number(val)) || Number(val) < -2147483648 || Number(val) > 2147483647) throw runtimeError('ErroValorEntradaInvalido', 'Digite um número inteiro válido entre -2147483648 e 2147483647.');
                return Number(val);
            }
            if (type === 'real') {
                const number = Number(val.replace(',', '.'));
                if (!val || !Number.isFinite(number)) throw runtimeError('ErroValorEntradaInvalido', 'Digite um número real válido.');
                return number;
            }
            if (type === 'logico') {
                if (!['verdadeiro', 'falso'].includes(val.toLowerCase())) throw runtimeError('ErroValorEntradaInvalido', 'Digite verdadeiro ou falso.');
                return val.toLowerCase() === 'verdadeiro';
            }
            if (val === '') return '';
            const normalized = val.replace(',', '.');
            if (!isNaN(normalized) && !isNaN(parseFloat(normalized))) {
                return Number(normalized);
            }
            if (val.toLowerCase() === 'verdadeiro') return true;
            if (val.toLowerCase() === 'falso') return false;
            return val;
        }

        async leia(type) {
            if (this.__aborted) throw new Error("EXECUCAO_INTERROMPIDA");
            if (!this.consoleEl) {
                const val = typeof prompt !== 'undefined' ? (prompt('Entrada: ') || '') : '';
                return this._parseInput(val, type);
            }

            return new Promise((resolve, reject) => {
                const resolver = { resolve, reject };
                this.__inputResolvers.push(resolver);

                const inputWrap = document.createElement('span');
                inputWrap.className = 'console-input-wrap';
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'console-inline-input';
                inputWrap.appendChild(input);
                this.consoleEl.appendChild(inputWrap);
                this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
                setTimeout(() => input.focus({ preventScroll: true }), 15);

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const raw = input.value;
                        inputWrap.textContent = raw + '\n';
                        const idx = this.__inputResolvers.indexOf(resolver);
                        if (idx !== -1) this.__inputResolvers.splice(idx, 1);
                        try { resolve(this._parseInput(raw, type)); } catch (error) { reject(error); }
                    }
                });
            });
        }
    }


Object.assign(PortugolRuntime.prototype, valueMethods, presentationMethods);
export { PortugolRuntime };
