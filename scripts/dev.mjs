import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid) continue;
    try {
      if (process.platform === 'win32') child.kill('SIGTERM');
      else process.kill(-child.pid, 'SIGTERM');
    } catch { /* The child may have already exited. */ }
  }
  process.exitCode = code;
}
for (const name of ['server', 'client']) {
  const child = spawn(npm, ['run', `dev:${name}`], { cwd: root, stdio: 'inherit', detached: process.platform !== 'win32' });
  children.push(child);
  child.on('error', (error) => { console.error(`Could not start ${name}: ${error.message}`); stop(1); });
  child.on('exit', (code) => { if (!stopping) stop(code ?? 1); });
}
process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());
