import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function fixture(t) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'portugol-pre-push-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git('init', '-q');
  git('config', 'user.name', 'Hook test');
  git('config', 'user.email', 'hook@example.invalid');
  mkdirSync(path.join(cwd, 'scripts/hooks'), { recursive: true });
  for (const file of ['install-git-hooks.js', 'pre-push.js', 'hooks/pre-push']) {
    copyFileSync(path.join(root, 'scripts', file), path.join(cwd, 'scripts', file));
  }
  writeFileSync(path.join(cwd, '.gitignore'), 'verification-ran\n');
  writeFileSync(path.join(cwd, 'app.txt'), 'original');
  writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ type: 'module', scripts: { 'test:all': 'node check.js' } }));
  writeFileSync(path.join(cwd, 'check.js'), `
    import { writeFileSync } from 'node:fs';
    writeFileSync('verification-ran', 'yes');
    if (process.env.CHECK_DIRTY === '1') writeFileSync('app.txt', 'changed during checks');
    process.exitCode = Number(process.env.CHECK_EXIT_CODE || 0);
  `);
  git('add', '.');
  git('commit', '-qm', 'fixture');
  const head = git('rev-parse', 'HEAD');
  const update = (sha = head) => `refs/heads/main ${sha} refs/heads/main ${'0'.repeat(40)}\n`;
  const run = (input = update(), env = {}) => spawnSync(process.execPath, ['scripts/pre-push.js'], {
    cwd, input, encoding: 'utf8', env: { ...process.env, CHECK_EXIT_CODE: '0', CHECK_DIRTY: '0', ...env },
  });
  const installed = () => spawnSync(process.execPath, ['scripts/install-git-hooks.js'], {
    cwd, encoding: 'utf8', env: { ...process.env, CI: '' },
  });
  const checked = () => existsSync(path.join(cwd, 'verification-ran'));
  return { cwd, git, head, update, run, checked, installed };
}

test('pré-push aprova o HEAD limpo somente após executar a verificação completa', t => {
  const f = fixture(t), result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.checked(), true);
});

test('pré-push bloqueia falha na verificação e mudanças feitas durante os testes', t => {
  const f = fixture(t);
  const failed = f.run(undefined, { CHECK_EXIT_CODE: '1' });
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /test:all falhou/);
  const changed = f.run(undefined, { CHECK_DIRTY: '1' });
  assert.equal(changed.status, 1);
  assert.match(changed.stderr, /conteúdo mudou/);
});

test('pré-push rejeita arquivos alterados e não rastreados antes de rodar testes', t => {
  const f = fixture(t);
  writeFileSync(path.join(f.cwd, 'novo.txt'), 'untracked');
  assert.equal(f.run().status, 1);
  assert.equal(f.checked(), false);
  f.git('add', 'novo.txt');
  f.git('commit', '-qm', 'new file');
  writeFileSync(path.join(f.cwd, 'app.txt'), 'dirty');
  const dirty = f.run(f.update(f.git('rev-parse', 'HEAD')));
  assert.equal(dirty.status, 1);
  assert.match(dirty.stderr, /não commitadas/);
  assert.equal(f.checked(), false);
});

test('pré-push não valida outro commit usando os arquivos do HEAD', t => {
  const f = fixture(t);
  writeFileSync(path.join(f.cwd, 'app.txt'), 'next');
  f.git('commit', '-qam', 'next');
  const result = f.run(f.update(f.head));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /não aponta para o HEAD/);
  assert.equal(f.checked(), false);
});

test('excluir uma referência remota não publica código nem exige build', t => {
  const f = fixture(t);
  assert.equal(f.run(f.update('0'.repeat(40))).status, 0);
  assert.equal(f.checked(), false);
});

test('instalação é repetível e o hook instalado bloqueia um push com falhas', t => {
  const f = fixture(t);
  assert.equal(f.installed().status, 0);
  assert.equal(f.installed().status, 0);
  const hook = readFileSync(path.join(f.cwd, '.git/hooks/pre-push'), 'utf8');
  assert.match(hook, /node scripts\/pre-push.js/);
  assert.equal(hook.includes('\r'), false);
  const remote = path.join(f.cwd, 'remote.git');
  f.git('init', '--bare', '-q', remote);
  writeFileSync(path.join(f.cwd, '.git/info/exclude'), 'remote.git/\n');
  const result = spawnSync('git', ['push', remote, 'HEAD:refs/heads/main'], {
    cwd: f.cwd, encoding: 'utf8', env: { ...process.env, CHECK_EXIT_CODE: '1' },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Push bloqueado/);
  assert.equal(f.checked(), true);
  assert.equal(f.git('--git-dir', remote, 'for-each-ref'), '');
});

test('instalação preserva um pré-push personalizado', t => {
  const f = fixture(t), target = path.join(f.cwd, '.git/hooks/pre-push');
  writeFileSync(target, '#!/bin/sh\necho custom\n');
  const result = f.installed();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Hook personalizado preservado/);
  assert.equal(readFileSync(target, 'utf8'), '#!/bin/sh\necho custom\n');
});
