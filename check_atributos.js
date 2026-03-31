import { getConnection } from './src/database/database.js';

async function run() {
    const conn = await getConnection();
    const [attrs] = await conn.query('SELECT * FROM atributo');
    console.log("Atributos:", attrs);
    conn.release();
    process.exit(0);
}

run();
