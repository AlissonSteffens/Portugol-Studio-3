import { tokenize } from './transpiler.js';

const special = {
  ENTER: [10, 'Enter'], BACKSPACE: [8, '⌫'], TAB: [9, 'Tab'], SHIFT: [16, 'Shift'],
  CONTROL: [17, 'Ctrl'], ALT: [18, 'Alt'], ESC: [27, 'Esc'], ESPACO: [32, 'Espaço'],
  SETA_ESQUERDA: [37, '←', 'left'], SETA_ACIMA: [38, '↑', 'up'],
  SETA_DIREITA: [39, '→', 'right'], SETA_ABAIXO: [40, '↓', 'down'],
  MENOS: [45, '−'], IGUAL: [61, '='], ADICAO: [107, '+'], SUBTRACAO: [109, '−'],
};
function keyDefinition(name) {
  const value = special[name] || (/^[A-Z0-9]$/.test(name) ? [name.charCodeAt(0), name] : null);
  return value && { code: value[0], label: value[1], direction: value[2] || null };
}
const knownKeys = [...Object.keys(special), ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].map(keyDefinition);

// Tokens keep comments and text literals from accidentally enabling controls.
export function detectInputProfile(source) {
  const tokens = tokenize(source).filter(t => !['whitespace', 'comment'].includes(t.type));
  const libraries = new Map();
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].value === 'inclua' && tokens[i + 1]?.value === 'biblioteca') {
      const name = tokens[i + 2]?.value;
      if (['Teclado', 'Mouse'].includes(name)) libraries.set(tokens[i + 3]?.value === '-->' ? tokens[i + 4]?.value : name, name);
    }
  }
  const keys = new Map(), mouseButtons = new Set();
  let keyboard = false, mouse = false, relativeMouse = false;
  for (let i = 0; i < tokens.length - 2; i++) {
    if (tokens[i + 1].value !== '.') continue;
    const library = libraries.get(tokens[i].value), member = tokens[i + 2].value;
    if (library === 'Teclado') {
      keyboard = true;
      const key = member.startsWith('TECLA_') ? keyDefinition(member.slice(6)) : null;
      if (key) keys.set(key.code, key);
      if (member === 'tecla_pressionada' && tokens[i + 3]?.value === '(' && tokens[i + 4]?.type === 'number' && tokens[i + 5]?.value === ')') {
        const code = Number(tokens[i + 4].value), definition = knownKeys.find(key => key.code === code);
        keys.set(code, definition || { code, label: String(code), direction: null });
      }
    }
    if (library === 'Mouse') {
      mouse = true;
      if (['capturar_cursor', 'cursor_capturado', 'movimento_x', 'movimento_y'].includes(member)) relativeMouse = true;
      const button = { BOTAO_ESQUERDO: 0, BOTAO_DIREITO: 1, BOTAO_MEIO: 2 }[member];
      if (button !== undefined) mouseButtons.add(button);
      if (member === 'botao_pressionado' && tokens[i + 4]?.type === 'number') mouseButtons.add(Number(tokens[i + 4].value));
    }
  }
  if (keyboard && !keys.size) keys.set(10, keyDefinition('ENTER'));
  if (mouse && !mouseButtons.size) mouseButtons.add(0);
  return { keys: [...keys.values()], mouse, relativeMouse, mouseButtons: [...mouseButtons].filter(b => b >= 0 && b <= 2) };
}
