import { installLibraries } from '../libraries/install.js';
import { presentationMethods } from './presentation.js';
import { runtimeError } from '../core/diagnostics/index.js';
/**
 * Portugol Studio Web - Runtime Engine
 * Implementação completa das bibliotecas do Portugol Studio:
 * Graficos, Matematica, Util, Teclado, Mouse, Tipos, Calendario, Texto e E/S.
 */

import { valueMethods } from '../core/execution/values.js';
import { recordingContext } from '../libraries/graphics/recording-context.js';
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
            installLibraries(this);
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
