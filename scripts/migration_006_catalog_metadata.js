import { getConnection } from '../src/database/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Agrega metadata visual/dinámica al catálogo de módulos y submódulos:
// icon/group_name/sort_order/frontend_route (mapeo hacia client-v2) e
// is_visible (interruptor maestro para ocultar del sidebar sin tocar permisos).
async function addCatalogMetadataColumns() {
    let connection;
    try {
        connection = await getConnection();
        console.log("Conectado a la base de datos.");

        const columnasNuevas = `
            ADD COLUMN icon VARCHAR(50) NULL DEFAULT NULL,
            ADD COLUMN group_name VARCHAR(50) NULL DEFAULT NULL,
            ADD COLUMN sort_order INT NOT NULL DEFAULT 0,
            ADD COLUMN frontend_route VARCHAR(150) NULL DEFAULT NULL,
            ADD COLUMN is_visible TINYINT(1) NOT NULL DEFAULT 1
        `;

        for (const tabla of ['modulo', 'submodulos']) {
            try {
                await connection.query(`ALTER TABLE ${tabla} ${columnasNuevas}`);
                console.log(`Columnas de metadata agregadas a \`${tabla}\`.`);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Columnas de metadata ya existen en \`${tabla}\`.`);
                } else {
                    throw error;
                }
            }
        }

        console.log("Migración completada con éxito.");
    } catch (error) {
        console.error("Error durante la migración:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

addCatalogMetadataColumns();
