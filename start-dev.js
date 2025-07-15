const { spawn } = require('child_process');



// Ejecutar backend
const backend = spawn('npm', ['run', 'dev'], { 
  stdio: 'inherit',
  shell: true 
});

// Ejecutar frontend
const frontend = spawn('npm', ['run', 'client'], { 
  stdio: 'inherit',
  shell: true 
});

// Manejar cierre del proceso
process.on('SIGINT', () => {
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
});

backend.on('close', (code) => {
  console.log(`Backend terminado con código: ${code}`);
});

frontend.on('close', (code) => {
  console.log(`Frontend terminado con código: ${code}`);
});
