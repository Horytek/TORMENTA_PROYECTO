import 'dotenv/config';
import mysql from 'mysql2/promise';
import { decrypt } from '../src/utils/cryptoUtil.js';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: true }
});

const [rows] = await conn.query(
  "SELECT tipo, valor FROM clave WHERE id_empresa = 2 AND tipo LIKE 'sunat_%'"
);

console.log('Credenciales SUNAT para id_empresa=2:\n');

for (const r of rows) {
  try {
    const dec = decrypt(r.valor);
    // Ocultar passwords parcialmente
    if (r.tipo.includes('pass')) {
      console.log(`${r.tipo}: [length=${dec.length}] "${dec.substring(0,3)}...${dec.substring(dec.length-3)}"`);
    } else if (r.tipo.includes('p12')) {
      console.log(`${r.tipo}: [base64 length=${dec.length}]`);
    } else {
      console.log(`${r.tipo}: "${dec}"`);
    }
  } catch (e) {
    console.log(`${r.tipo}: ERROR - ${e.message}`);
  }
}

// Comparar con .env.sunat.local
console.log('\n--- Comparación con .env.sunat.local ---');
console.log(`ENV SOL_USER: TORMENTA`);
console.log(`ENV SOL_PASS: [length=13] "Uli...890"`);

conn.end();
