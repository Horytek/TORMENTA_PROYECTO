import { exec } from 'child_process';

exec('npm run dev -- --host', (err, stdout, stderr) => {
  if (err) {
    console.error(`Error: ${err}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
});
