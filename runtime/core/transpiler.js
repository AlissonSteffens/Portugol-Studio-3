import { compile } from './compiler.js';
/**
 * Portugol Studio Web - Transpilador de Portugol para JavaScript
 * Transpila código Portugol (estruturas, tipos, funções, bibliotecas) para JavaScript ES2022+ com suporte a async/await.
 */

'use strict';

    const TYPES = new Set(['inteiro', 'real', 'logico', 'cadeia', 'caracter', 'vazio']);
    const JS_RESERVED = new Set([
        'switch', 'delete', 'class', 'default', 'function', 'var', 'import', 'export',
        'extends', 'super', 'this', 'debugger', 'yield', 'catch', 'finally', 'try',
        'throw', 'new', 'in', 'instanceof', 'continue', 'break', 'const', 'let', 'while',
        'for', 'do', 'if', 'else', 'return', 'void', 'with', 'typeof'
    ]);

    function tokenize(src) {
        const tokens = [];
        let i = 0;
        const len = src.length;

        while (i < len) {
            // 1. Whitespace
            if (/\s/.test(src[i])) {
                let start = i;
                while (i < len && /\s/.test(src[i])) i++;
                tokens.push({ type: 'whitespace', value: src.substring(start, i) });
                continue;
            }

            // 2. Block comment /* ... */
            if (src[i] === '/' && src[i + 1] === '*') {
                let start = i;
                i += 2;
                while (i < len && !(src[i] === '*' && src[i + 1] === '/')) i++;
                if (i < len) i += 2;
                tokens.push({ type: 'comment', value: src.substring(start, i) });
                continue;
            }

            // 3. Line comment // ...
            if (src[i] === '/' && src[i + 1] === '/') {
                let start = i;
                while (i < len && src[i] !== '\n') i++;
                tokens.push({ type: 'comment', value: src.substring(start, i) });
                continue;
            }

            // 4. String literal "..."
            if (src[i] === '"') {
                let start = i++;
                while (i < len && src[i] !== '"') {
                    if (src[i] === '\\' && i + 1 < len) i++;
                    i++;
                }
                if (i < len) i++;
                tokens.push({ type: 'string', value: src.substring(start, i) });
                continue;
            }

            // 5. Char literal '...'
            if (src[i] === "'") {
                let start = i++;
                while (i < len && src[i] !== "'") {
                    if (src[i] === '\\' && i + 1 < len) i++;
                    i++;
                }
                if (i < len) i++;
                tokens.push({ type: 'char', value: src.substring(start, i) });
                continue;
            }

            // 6. Numbers (hex, float, int)
            if (src[i] === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
                let start = i;
                i += 2;
                while (i < len && /[0-9a-fA-F]/.test(src[i])) i++;
                tokens.push({ type: 'number', value: src.substring(start, i) });
                continue;
            }
            if (/[0-9]/.test(src[i])) {
                let start = i;
                while (i < len && /[0-9]/.test(src[i])) i++;
                if (i < len && src[i] === '.' && /[0-9]/.test(src[i + 1])) {
                    i++;
                    while (i < len && /[0-9]/.test(src[i])) i++;
                }
                tokens.push({ type: 'number', value: src.substring(start, i) });
                continue;
            }

            // 7. Multi-character operators
            const twoChar = src.substring(i, i + 2);
            const threeChar = src.substring(i, i + 3);
            if (['-->', '>>>'].includes(threeChar)) {
                tokens.push({ type: 'op', value: threeChar });
                i += 3;
                continue;
            }
            if (['==', '!=', '<=', '>=', '++', '--', '+=', '-=', '*=', '/=', '%=', '<<', '>>'].includes(twoChar)) {
                tokens.push({ type: 'op', value: twoChar });
                i += 2;
                continue;
            }

            // 8. Single-character punctuation or operator
            if ('{}()[];,.'.includes(src[i])) {
                tokens.push({ type: 'punct', value: src[i] });
                i++;
                continue;
            }
            if ('+-*/%<>=!&|^~?:'.includes(src[i])) {
                tokens.push({ type: 'op', value: src[i] });
                i++;
                continue;
            }

            // 9. Identifiers / Keywords
            if (/[A-Za-z_\u00C0-\u00FF]/.test(src[i])) {
                let start = i;
                while (i < len && /[A-Za-z0-9_\u00C0-\u00FF]/.test(src[i])) i++;
                tokens.push({ type: 'ident', value: src.substring(start, i) });
                continue;
            }

            // Other
            tokens.push({ type: 'unknown', value: src[i] });
            i++;
        }

        return tokens;
    }

    function transpilePortugol(source, options = {}) {
        return compile(tokenize(source), options);
    }

export { tokenize, transpilePortugol };
