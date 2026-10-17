import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function git(...args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr.trim());
  return result.stdout.trim();
}

try {
  const updates = readFileSync(0, 'utf8').trim().split('\n').filter(Boolean)
    .map(line => line.trim().split(/\s+/)).filter(([, sha]) => !/^0+$/.test(sha));
  // Deleting remote refs does not publish code.
  if (updates.length) {
    const head = git('rev-parse', 'HEAD');
    for (const [ref, sha] of updates) {
      if (git('rev-parse', '--verify', `${sha}^{commit}`) !== head) {
        throw new Error(`A referência ${ref} não aponta para o HEAD. Faça checkout do commit a enviar para validar seu conteúdo.`);
      }
    }
    if (git('status', '--porcelain', '--untracked-files=all')) {
      throw new Error('Há alterações não commitadas. Faça commit ou guarde as alterações para testar exatamente o conteúdo do push.');
    }
    console.log('Pré-push: executando as mesmas verificações do GitHub Pages.');
    const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'test:all'], {
      stdio: ['ignore', 'inherit', 'inherit'], shell: process.platform === 'win32',
    });
    if (result.error || result.status !== 0) throw new Error(result.error?.message || 'npm run test:all falhou.');
    if (git('rev-parse', 'HEAD') !== head || git('status', '--porcelain', '--untracked-files=all')) {
      throw new Error('O conteúdo mudou durante a verificação. Repita o push com a árvore limpa.');
    }
  }
} catch (error) {
  console.error(`Push bloqueado: ${error.message}`);
  process.exitCode = 1;
}
