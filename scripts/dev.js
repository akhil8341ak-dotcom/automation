import { spawn } from 'node:child_process';
import * as path from 'node:path';

console.log('================================================================');
console.log('🚀 Starting CreatorFlow AI in Full Development Mode...');
console.log('================================================================');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Start Server
const server = spawn(npmCmd, ['run', 'dev', '--workspace=@creatorflow/server'], {
  stdio: 'inherit',
  shell: true,
});

// 2. Start Client
const client = spawn(npmCmd, ['run', 'dev', '--workspace=@creatorflow/client'], {
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\n🛑 Shutting down CreatorFlow AI development servers...');
  server.kill();
  client.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
