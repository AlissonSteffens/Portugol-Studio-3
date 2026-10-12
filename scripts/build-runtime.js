import { mkdir, writeFile } from 'node:fs/promises';
import { runtimeBundle } from './runtime-build.js';
await mkdir('dist/runtime', { recursive: true });
await writeFile('dist/runtime/portugol.js', await runtimeBundle());
console.log('Runtime independente gerado em dist/runtime/portugol.js');
