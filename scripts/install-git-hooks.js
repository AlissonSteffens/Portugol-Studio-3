import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// CI validates in the workflow; published source archives need no Git hooks.
if (!process.env.CI) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const result = spawnSync('git', ['rev-parse', '--git-path', 'hooks/pre-push'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    console.log('Hooks não instalados: este diretório não é um checkout Git.');
  } else {
    const destination = path.resolve(root, result.stdout.trim());
    const marker = '# portugol-studio-web: pre-push';
    if (existsSync(destination) && !readFileSync(destination, 'utf8').includes(marker)) {
      throw new Error(`Hook personalizado preservado em ${destination}. Integre node scripts/pre-push.js antes de continuar.`);
    }
    const source = readFileSync(path.join(root, 'scripts/hooks/pre-push'), 'utf8').replaceAll('\r\n', '\n');
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, source, { mode: 0o755 });
    chmodSync(destination, 0o755);
    console.log('Pré-push instalado: árvore limpa, HEAD e npm run test:all obrigatórios.');
  }
}
