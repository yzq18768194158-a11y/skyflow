import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const tasks = [
  { name: 'server', command: 'npx', args: ['tsx', 'server/index.ts'] },
  { name: 'client', command: 'npx', args: ['vite', '--port=3000', '--host=0.0.0.0'] },
];

const children = tasks.map((task) => {
  const child = spawn(task.command, task.args, {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
});

function shutdown(signal: NodeJS.Signals) {
  for (const child of children) {
    child.kill(signal);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
