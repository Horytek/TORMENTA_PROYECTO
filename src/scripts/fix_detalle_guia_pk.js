import { getConnection } from '../database/database.js';

const fixSchema = async () => {
    let connection;
    try {
        console.log("Iniciando migración de detalle_envio...");
        connection = await getConnection();

        // 1. Verificar la clave primaria actual
        const [keys] = await connection.query(`
            SHOW KEYS FROM detalle_envio WHERE Key_name = 'PRIMARY'
        `);

        console.log("Claves primarias actuales:", keys.map(k => k.Column_name));

        const isComposite = keys.length > 1 && keys.some(k => k.Column_name === 'id_producto');

        if (isComposite) {
            console.log("Detectada PK compuesta (id_guiaremision, id_producto). Procediendo a modificar...");

            // 2. Eliminar la PK actual
            await connection.query("ALTER TABLE detalle_envio DROP PRIMARY KEY");
            console.log("PK antigua eliminada.");

            // 3. Agregar columna id_detalle si no existe
            const [columns] = await connection.query("SHOW COLUMNS FROM detalle_envio LIKE 'id_detalle'");
            if (columns.length === 0) {
                await connection.query("ALTER TABLE detalle_envio ADD COLUMN id_detalle INT AUTO_INCREMENT PRIMARY KEY FIRST");
                console.log("Columna id_detalle agregada y establecida como PRIMARY KEY.");
            } else {
                console.log("Columna id_detalle ya existe. Asignando PRIMARY KEY...");
                await connection.query("ALTER TABLE detalle_envio ADD PRIMARY KEY (id_detalle)");
            }

            // 4. Agregar índice para búsquedas rápidas si se perdió con la PK explícita anterior
            // A menudo MySQL mantiene el índice si era parte de la PK, pero por si acaso.
            try {
                await connection.query("CREATE INDEX idx_guia_prod ON detalle_envio(id_guiaremision, id_producto)");
                console.log("Índice (id_guiaremision, id_producto) creado.");
            } catch (idxError) {
                console.log("Índice ya existe o no se pudo crear (no crítico):", idxError.message);
            }

            console.log("Migración completada exitosamente.");
        } else {
            console.log("La tabla detalle_envio ya parece tener una estructura correcta o diferente a la esperada.");

            // Check if id_detalle exists
            const [columns] = await connection.query("SHOW COLUMNS FROM detalle_envio LIKE 'id_detalle'");
            if (columns.length > 0) {
                console.log("La columna id_detalle ya existe.");
            } else {
                console.log("Advertencia: No se detectó PK compuesta problemática, pero tampoco existe id_detalle. Verifica manualmente.");
            }
        }

    } catch (e) {
        console.error("Error durante la migración:", e);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

fixSchema();
