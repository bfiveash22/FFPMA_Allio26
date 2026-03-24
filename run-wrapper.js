import { spawn } from 'child_process';
import * as fs from 'fs';

const child = spawn('npx', ['tsx', 'server/scripts/extract-training-data.ts'], { shell: true });
let output = '';

child.stdout.on('data', (data) => {
  output += data.toString();
});
child.stderr.on('data', (data) => {
  output += data.toString();
});

child.on('close', (code) => {
  // Replace carriage returns with newlines to prevent terminal overwriting
  const clean = output.replace(/\r/g, '\n');
  fs.writeFileSync('clean_error.log', clean);
  console.log('Wrote pure error to clean_error.log. Exit code:', code);
});
