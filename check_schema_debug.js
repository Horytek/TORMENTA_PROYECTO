
import { getConnection } from './src/database/database.js';

async function checkSchema() {
    let connection;
    try {
        connection = await getConnection();
        const tables = ['venta', 'bitacora_nota', 'nota', 'detalle_venta', 'detalle_nota', 'producto', 'marca', 'comprobante', 'usuario', 'almacen', 'sucursal_almacen', 'tonalidad', 'talla', 'inventario'];

        for (const table of tables) {
            console.log(`\n--- Columns for ${table} ---`);
            try {
                const [rows] = await connection.execute(`SHOW COLUMNS FROM ${table}`);
                rows.forEach(row => {
                    console.log(`${row.Field} (${row.Type})`);
                });
            } catch (err) {
                console.log(`Error checking table ${table}: ${err.message}`);
            }
        }

    } catch (error) {
        console.error('Error connecting:', error);
    } finally {
        if (connection) {
            // Just exit, pool will hang otherwise if we don't close it, but we can just let process exit
            process.exit(0);
        }
    }
}

checkSchema();
