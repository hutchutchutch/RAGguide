// This is an entry point for the server that redirects to the new src directory structure
// This allows us to maintain compatibility with existing scripts and configuration

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the new main entry point in the src directory
const mainScript = resolve(__dirname, 'src', 'index.js');

console.log(`Starting server from: ${mainScript}`);

// Fork a child process to run the actual server
const serverProcess = fork(mainScript, [], {
  stdio: 'inherit',
  env: process.env
});

// Forward process signals to the child process
process.on('SIGINT', () => serverProcess.kill('SIGINT'));
process.on('SIGTERM', () => serverProcess.kill('SIGTERM'));
process.on('exit', () => serverProcess.kill());

// Log any errors from the child process
serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
  process.exit(1);
});

// Exit the parent process with the same code when the child exits
serverProcess.on('close', (code) => {
  process.exit(code);
});