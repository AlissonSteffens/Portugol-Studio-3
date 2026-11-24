// Pure decisions of the desktop updater, kept apart from Electron so they can be tested.
const path = require('node:path');

const REPOSITORY = 'AlissonSteffens/Portugol-Studio-3';
const DOWNLOAD_PAGE = 'https://alissonsteffens.github.io/Portugol-Studio-3/#versoes';

/** Compares 'v3.1.0' with '3.0.2' by their numeric parts: >0 when a is newer. Pre-releases are ignored. */
function compareVersions(a, b) {
  const parts = version => String(version).trim().replace(/^v/i, '').split(/[-+]/)[0].split('.').map(part => Number.parseInt(part, 10) || 0);
  const left = parts(a), right = parts(b);
  for (let i = 0; i < Math.max(left.length, right.length, 3); i++) {
    const difference = (left[i] || 0) - (right[i] || 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

/**
 * How this copy of the app can be updated:
 * - 'install': electron-updater downloads and installs (Windows installer, AppImage);
 * - 'notify': only warns and opens the download page (macOS without a Developer ID signature, .zip, .deb, .tar.gz);
 * - 'off': development runs.
 */
function updateMode({ packaged, platform, execPath, env = {}, exists }) {
  if (!packaged) return 'off';
  // The NSIS installer leaves its uninstaller beside the executable; the portable .zip does not.
  if (platform === 'win32') return exists(path.join(path.dirname(execPath), 'Uninstall Portugol Studio.exe')) ? 'install' : 'notify';
  if (platform === 'linux') return env.APPIMAGE ? 'install' : 'notify';
  // Squirrel.Mac only accepts updates signed with the same Developer ID certificate.
  return 'notify';
}

/** Reads the latest published release from the GitHub API response. Drafts never appear there. */
function parseRelease(release) {
  if (!release || typeof release.tag_name !== 'string') return null;
  return { version: release.tag_name.replace(/^v/i, ''), url: typeof release.html_url === 'string' && release.html_url.startsWith('https://github.com/') ? release.html_url : DOWNLOAD_PAGE };
}

module.exports = { REPOSITORY, DOWNLOAD_PAGE, compareVersions, updateMode, parseRelease };
