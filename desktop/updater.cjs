// Checks GitHub for a newer release. Where the package allows it (Windows installer, AppImage),
// electron-updater downloads the new version and installs it on restart; elsewhere the user
// is sent to the download page.
const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow, dialog, net, shell } = require('electron');
const { REPOSITORY, DOWNLOAD_PAGE, compareVersions, updateMode, parseRelease } = require('./update-policy.cjs');

let mode = 'off';
let updater;
let checking = false;
let downloaded = null;
let restartPending = false;

const stateFile = () => path.join(app.getPath('userData'), 'atualizacoes.json');
function skippedVersion() { try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')).skipped; } catch { return undefined; } }
function skip(version) { try { fs.writeFileSync(stateFile(), JSON.stringify({ skipped: version })); } catch {} }

function ask(options) {
  const window = BrowserWindow.getFocusedWindow();
  const settings = { title: 'Portugol Studio', noLink: true, ...options };
  return window ? dialog.showMessageBox(window, settings) : dialog.showMessageBox(settings);
}
const tell = (message, detail, type = 'info') => ask({ type, message, detail, buttons: ['OK'] });
const releasePage = version => `https://github.com/${REPOSITORY}/releases/tag/v${version}`;
function setProgress(value) { for (const window of BrowserWindow.getAllWindows()) window.setProgressBar(value); }

function getUpdater() {
  if (updater) return updater;
  ({ autoUpdater: updater } = require('electron-updater'));
  updater.autoDownload = false;
  // Choosing "Depois" installs the update the next time the app quits.
  updater.autoInstallOnAppQuit = true;
  updater.logger = null;
  updater.on('download-progress', progress => setProgress(Math.max(0.01, progress.percent / 100)));
  return updater;
}

async function latestFromUpdater() {
  const result = await getUpdater().checkForUpdates();
  const version = result?.updateInfo?.version;
  return version ? { version, url: releasePage(version) } : null;
}

async function latestFromGitHub() {
  const response = await net.fetch(`https://api.github.com/repos/${REPOSITORY}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
  if (response.status === 404) return null; // No published release yet.
  if (!response.ok) throw new Error(`GitHub respondeu ${response.status}.`);
  return parseRelease(await response.json());
}

async function offer(latest) {
  const install = mode === 'install';
  const { response } = await ask({
    type: 'info', message: `O Portugol Studio ${latest.version} está disponível.`,
    detail: `Você está usando a versão ${app.getVersion()}. ` + (install
      ? 'A atualização é baixada agora e instalada quando o Portugol Studio reiniciar.'
      : 'Baixe e instale a nova versão para atualizar. Seus programas salvos continuam disponíveis.'),
    buttons: [install ? 'Atualizar' : 'Baixar', 'Ver novidades', 'Agora não'], defaultId: 0, cancelId: 2,
  });
  if (response === 1) { shell.openExternal(latest.url); return; }
  if (response === 2) { skip(latest.version); return; }
  if (!install) { shell.openExternal(DOWNLOAD_PAGE); return; }
  try {
    setProgress(0.01);
    await getUpdater().downloadUpdate();
    downloaded = latest;
  } catch (error) {
    await tell('Não foi possível baixar a atualização.', `${error.message}\n\nVocê também pode baixar a nova versão na página do Portugol Studio.`, 'warning');
    return;
  } finally {
    setProgress(-1);
  }
  await offerRestart();
}

async function offerRestart() {
  const { response } = await ask({
    type: 'info', message: `A versão ${downloaded.version} está pronta para instalar.`,
    detail: 'Reinicie o Portugol Studio para concluir. Se escolher depois, a atualização é instalada quando você fechar o programa.',
    buttons: ['Reiniciar agora', 'Depois'], defaultId: 0, cancelId: 1,
  });
  if (response !== 0) return;
  // Close the windows first so each one can ask about unsaved changes; main.cjs calls
  // finishRestart() when all of them are gone, or cancelRestart() if the user keeps one open.
  restartPending = true;
  for (const window of BrowserWindow.getAllWindows()) window.close();
}

/** Checks for a newer release. Automatic checks stay quiet unless there is something to offer. */
async function check({ manual = false } = {}) {
  if (mode === 'off') { if (manual) await tell('As atualizações automáticas funcionam só na versão instalada.', 'Em desenvolvimento, atualize o repositório.'); return; }
  if (downloaded) { await offerRestart(); return; }
  if (checking) { if (manual) await tell('A busca por atualizações já está em andamento.'); return; }
  checking = true;
  try {
    const latest = mode === 'install' ? await latestFromUpdater() : await latestFromGitHub();
    if (!latest || compareVersions(latest.version, app.getVersion()) <= 0) {
      if (manual) await tell('Você já está usando a versão mais recente.', `Portugol Studio ${app.getVersion()}`);
      return;
    }
    if (!manual && skippedVersion() === latest.version) return;
    await offer(latest);
  } catch (error) {
    if (manual) await tell('Não foi possível procurar atualizações.', `Verifique a conexão com a internet e tente de novo.\n\n${error.message}`, 'warning');
  } finally {
    checking = false;
  }
}

function start() {
  mode = updateMode({ packaged: app.isPackaged, platform: process.platform, execPath: process.execPath, env: process.env, exists: fs.existsSync });
  if (mode !== 'off') setTimeout(() => check(), 8000);
}

/** Called when every window has closed; returns true when it is installing the update. */
function finishRestart() {
  if (!restartPending) return false;
  // Silent install, then open the new version (the installer keeps the chosen folder).
  getUpdater().quitAndInstall(true, true);
  return true;
}

function cancelRestart() { restartPending = false; }

module.exports = { start, check, finishRestart, cancelRestart };
