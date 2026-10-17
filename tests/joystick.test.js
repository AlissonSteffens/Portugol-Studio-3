import test from 'node:test';
import assert from 'node:assert/strict';
import { joystickDirections } from '../runtime/core/touch-controls.js';

test('joystick tem zona neutra e reconhece oito direções, inclusive fora do círculo', () => {
  for (const [x, y] of [[0, 0], [.1, -.1], [0, .19]]) assert.deepEqual(joystickDirections(x, y), []);
  for (const [x, y, expected] of [
    [1, 0, ['right']], [1, 1, ['right', 'down']], [0, 1, ['down']], [-1, 1, ['left', 'down']],
    [-1, 0, ['left']], [-1, -1, ['left', 'up']], [0, -1, ['up']], [1, -1, ['right', 'up']],
    [8, -7, ['right', 'up']], [1, .1, ['right']],
  ]) assert.deepEqual(joystickDirections(x, y), expected);
});
