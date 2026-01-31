import fs from 'fs';
import path from 'path';
const root = 'client/src';
const exts = ['.js','.jsx','.ts','.tsx'];
function walk(dir){
  for (const f of fs.readdirSync(dir)){
    const full = path.join(dir,f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (exts.includes(path.extname(full))){
      let code = fs.readFileSync(full,'utf8');
      if (/from ['"]axios['"]/.test(code) && !/['"]@\/api\/axios['"]/.test(code)){
        code = code.replace(/from ['"]axios['"]/g,"from '@/api/axios'");
        fs.writeFileSync(full,code,'utf8');
        //console.log('Reemplazado:', full);
      }
    }
  }
}
walk(root);