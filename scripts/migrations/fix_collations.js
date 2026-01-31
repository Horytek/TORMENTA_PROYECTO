import { getConnection } from "../../src/database/database.js";

const runMigration = async () => {
    let connection;
    try {
        console.log("Iniciando unificación de collation a utf8mb4_general_ci...");
        connection = await getConnection();

        const tables = [
            'producto',
            'producto_sku',
            'tonalidad',
            'talla',
            'venta',
            'bitacora_nota',
            'nota',
            'comprobante',
            'detalle_nota',
            'detalle_venta',
            'marca',
            'categoria',
            'sub_categoria',
            'almacen',
            'usuario',
            'inventario_stock',
            'atributo',
            'atributo_valor',
            'sku_atributo_valor'
        ];

        // Disable FK checks to avoid errors during conversion
        await connection.query("SET FOREIGN_KEY_CHECKS = 0");

        for (const table of tables) {
            try {
                console.log(`Convirtiendo tabla ${table}...`);
                // CONVERT TO CHARACTER SET... automatically converts columns too
                await connection.query(`ALTER TABLE ${table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
            } catch (err) {
                console.error(`Error en tabla ${table}:`, err.message);
                // Continue with other tables
            }
        }

        await connection.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log("Migración de collation finalizada.");

    } catch (error) {
        console.error("Error general:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

runMigration();
