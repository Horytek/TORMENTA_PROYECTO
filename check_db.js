
import { getConnection } from './src/database/database.js';

async function checkSubmodules() {
    const connection = await getConnection();
    try {
        const [rows] = await connection.query("SELECT * FROM submodulos WHERE nombre_sub IN ('Unidades', 'Tallas', 'Tonalidades')");
        console.log("Found Submodules:", rows);

        const [modulos] = await connection.query("SELECT * FROM modulo WHERE nombre_modulo LIKE '%Gestor%'");
        console.log("Found Modules:", modulos);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

checkSubmodules();
