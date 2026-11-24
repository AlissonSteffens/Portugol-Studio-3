// Builds installable desktop versions with Electron.
// Usage: npm run desktop:dist [-- --win|--mac|--linux] [--x64|--arm64] [--dir]
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import builder from 'electron-builder';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const electronVersion = JSON.parse(readFileSync(path.join(root, 'node_modules/electron/package.json'), 'utf8')).version;
// Pin the exact version tested in the repository.
const updaterVersion = JSON.parse(readFileSync(path.join(root, 'node_modules/electron-updater/package.json'), 'utf8')).version;
const output = path.join(root, 'release');
const staging = path.join(output, 'app');
const args = process.argv.slice(2);

// The desktop app serves the site from app://portugol/, so it always uses the root base.
const npmCli = process.env.npm_execpath;
const build = npmCli
  ? spawnSync(process.execPath, [npmCli, 'run', 'build'], { cwd: root, stdio: 'inherit', env: { ...process.env, VITE_BASE_PATH: '/' } })
  : spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env, VITE_BASE_PATH: '/' } });
if (build.status !== 0) { process.exitCode = 1; throw new Error('O build do site falhou.'); }

// Vite already bundles the site's dependencies; the main process only needs electron-updater.
rmSync(output, { recursive: true, force: true });
mkdirSync(path.join(staging, 'desktop'), { recursive: true });
for (const file of ['main.cjs', 'menu.cjs', 'preload.cjs', 'protocol.cjs', 'updater.cjs', 'update-policy.cjs', 'icon.png']) cpSync(path.join(root, 'desktop', file), path.join(staging, 'desktop', file));
cpSync(path.join(root, 'dist'), path.join(staging, 'dist'), { recursive: true });
writeFileSync(path.join(staging, 'package.json'), JSON.stringify({
  name: pkg.name, productName: 'Portugol Studio', version: pkg.version,
  description: 'Ambiente para aprender programação em Portugol.',
  author: 'Portugol Studio Web', homepage: 'https://github.com/AlissonSteffens/Portugol-Studio-3',
  main: 'desktop/main.cjs',
  dependencies: { 'electron-updater': updaterVersion },
}, null, 2));
const install = npmCli
  ? spawnSync(process.execPath, [npmCli, 'install', '--omit=dev', '--no-package-lock', '--no-audit', '--no-fund', '--ignore-scripts'], { cwd: staging, stdio: 'inherit' })
  : spawnSync('npm', ['install', '--omit=dev', '--no-package-lock', '--no-audit', '--no-fund', '--ignore-scripts'], { cwd: staging, stdio: 'inherit', shell: true });
if (install.status !== 0) { process.exitCode = 1; throw new Error('A instalação do electron-updater no pacote falhou.'); }

const platforms = { '--win': 'win', '--mac': 'mac', '--linux': 'linux' };
const archFlags = { '--x64': 'x64', '--arm64': 'arm64' };
const selected = args.filter(arg => platforms[arg]).map(arg => platforms[arg]);
const arch = args.filter(arg => archFlags[arg]).map(arg => archFlags[arg]);
const dirOnly = args.includes('--dir');
const targets = { win: ['nsis', 'zip'], mac: ['dmg', 'zip'], linux: ['AppImage', 'deb', 'tar.gz'] };
const current = { win32: 'win', darwin: 'mac', linux: 'linux' }[process.platform];
const target = name => {
  const list = dirOnly ? ['dir'] : targets[name];
  const archs = arch.length ? arch : name === 'mac' ? ['x64', 'arm64'] : ['x64'];
  return list.map(item => ({ target: item, arch: archs }));
};
const platformsToBuild = selected.length ? selected : [current];
// deb and AppImage spell architectures differently (amd64, x86_64); use one name for every Linux file.
const linuxArchs = arch.length ? arch : ['x64'];
if (platformsToBuild.includes('linux') && linuxArchs.length > 1) throw new Error('Gere uma arquitetura do Linux por vez.');
const [linuxArch] = linuxArchs;

await builder.build({
  projectDir: staging,
  ...Object.fromEntries(platformsToBuild.map(name => [name, []])),
  publish: 'never',
  config: {
    appId: 'br.portugol.studio.web',
    productName: 'Portugol Studio',
    copyright: 'Portugol Studio Web',
    electronVersion,
    directories: { output, buildResources: path.join(root, 'desktop') },
    // Stable names let the home page link to releases/latest/download/<name>.
    artifactName: 'Portugol-Studio-${os}-${arch}.${ext}',
    asar: true,
    npmRebuild: false,
    compression: 'normal',
    // Writes app-update.yml into the app and latest*.yml next to the installers; the workflow uploads them.
    publish: [{ provider: 'github', owner: 'AlissonSteffens', repo: 'Portugol-Studio-3' }],
    win: { icon: 'icon.png', artifactName: 'Portugol-Studio-windows-${arch}.${ext}', target: target('win') },
    nsis: { oneClick: false, perMachine: false, allowToChangeInstallationDirectory: true, createDesktopShortcut: true, shortcutName: 'Portugol Studio' },
    mac: { icon: 'icon.png', artifactName: 'Portugol-Studio-macos-${arch}.${ext}', target: target('mac'), category: 'public.app-category.education', identity: '-', hardenedRuntime: false, gatekeeperAssess: false },
    dmg: { title: 'Portugol Studio ${version}' },
    linux: { icon: 'icon.png', artifactName: `Portugol-Studio-linux-${linuxArch}.\${ext}`, target: target('linux'), category: 'Education', synopsis: 'IDE para aprender programação em Portugol', maintainer: 'Portugol Studio Web <https://github.com/AlissonSteffens/Portugol-Studio-3>', executableName: 'portugol-studio' },
    deb: { packageName: 'portugol-studio' },
  },
});
