import { spawnSync } from 'node:child_process';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Execute este script com npm run test:all.');
const failures = [];
function run(label, args, base = '/') {
  process.stdout.write(`\n${label}\n`);
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: base },
  });
  if (result.error) process.stderr.write(result.error.message + '\n');
  const passed = !result.error && result.status === 0;
  if (!passed) failures.push(label);
  return passed;
}

run('Testes do runtime', ['test']);
if (run('Build local', ['run', 'build'])) {
  run('Testes da aplicação', ['exec', '--', 'playwright', 'test']);
}
try {
  if (run('Build do GitHub Pages', ['run', 'build'], '/Portugol-Studio-3/')) {
    run('Testes em subpasta', ['exec', '--', 'playwright', 'test', '--config', 'playwright.pages.config.js']);
  }
} finally {
  run('Restaurar build local', ['run', 'build']);
}
if (failures.length) {
  process.stderr.write(`\nVerificação falhou: ${failures.join('; ')}.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('\nTodas as verificações passaram.\n');
}
