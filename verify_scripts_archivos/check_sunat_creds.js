import 'dotenv/config';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.CLAVE_ENCRYPTION_KEY || 'default-secret-key-32-chars-long!';

function decrypt(text) {
  try {
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('Decrypt error:', e.message);
    return text;
  }
}

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: true }
  });
  
  const [rows] = await conn.query(
    'SELECT tipo, valor FROM clave WHERE id_empresa = 2 AND tipo LIKE "sunat_%"'
  );
  
  console.log('Credenciales SUNAT para id_empresa=2:');
  rows.forEach(r => {
    const decrypted = decrypt(r.valor);
    console.log(`  ${r.tipo}: [${decrypted}] (len=${decrypted.length})`);
  });
  
  conn.end();
})();
