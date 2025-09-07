import fs from 'fs';
import path from 'path';

const exts = ['.js', '.jsx', '.ts', '.tsx'];

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('./client/src', function(filePath) {
  if (!exts.includes(path.extname(filePath))) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/from\s+['"]@nextui-org\/react['"]/g, "from '@heroui/react'")
    .replace(/from\s+['"]@nextui-org\/date-picker['"]/g, "from '@heroui/react'");
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Reemplazado:', filePath);
  }
});