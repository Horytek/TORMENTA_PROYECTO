const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

const exts = ['.js', '.jsx', '.ts', '.tsx'];

walk('./client/src', function(filePath) {
  if (!exts.includes(path.extname(filePath))) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(/(["'])@\/erp\//g, '$1@/').replace(/(["'])\/erp\//g, '$1/');
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Actualizado:', filePath);
  }
});