import { PortugolRuntime } from './runtime.js';
import { createProjectFiles } from './project-files.js';
import { mountTouchControls } from './input/touch-controls.js';
export async function mountProject(project, root = document) {
  const canvas = root.querySelector('#screen'), terminal = root.querySelector('#terminal'), status = root.querySelector('#status'), runButton = root.querySelector('#run'), stopButton = root.querySelector('#stop'), volume = root.querySelector('#volume'), list = root.querySelector('#files');
  let runtime, running = false;
  const report = error => { console.error(error); status.textContent = error.message; };
  const files = await createProjectFiles(project.assets, { projectId: project.id, onError: report, onChange: () => showFiles() });
  function showFiles() {
    list.replaceChildren();
    for (const entry of files.list()) { const button = document.createElement('button'); button.textContent = entry.path + ' · ' + (entry.size / 1024).toFixed(1) + ' KB'; button.onclick = async () => { try { const url = URL.createObjectURL(await files.blob(entry.path)), link = document.createElement('a'); link.href = url; link.download = entry.path.split('/').pop(); link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (error) { report(error); } }; list.append(button); }
  }
  showFiles();
  async function run() {
    if (running) return;
    running = true; runButton.disabled = true; stopButton.disabled = false; terminal.replaceChildren(); status.textContent = 'Executando';
    runtime = new PortugolRuntime(canvas, terminal, { files, masterVolume: Number(volume.value), networkMode: 'direct', onTitleChange: title => { document.title = title; } });
    const touchHost = canvas.ownerDocument.createElement('div'); touchHost.className = 'touch-controls-host';
    const stage = root.querySelector('#graphics-stage');
    if (stage) stage.append(touchHost); else canvas.after(touchHost);
    const disposeTouch = mountTouchControls(runtime, touchHost, project.inputProfile);
    try { await new Function('__runtime', project.compiled)(runtime); status.textContent = 'Concluído'; }
    catch (error) { if (error.message === 'EXECUCAO_INTERROMPIDA') status.textContent = 'Interrompido'; else report(error); }
    finally { disposeTouch(); touchHost.remove(); runtime.destroy(); runtime = null; try { await files.flush(); } catch (error) { report(error); } running = false; runButton.disabled = false; stopButton.disabled = true; showFiles(); }
  }
  runButton.onclick = run; stopButton.onclick = () => runtime?.abort(); volume.oninput = () => runtime?.setMasterVolume(Number(volume.value));
  const stop = () => { runtime?.abort(); runtime?.destroy(); files.close().catch(report); };
  window.addEventListener('pagehide', stop, { once: true });
  return { run, stop, files };
}

