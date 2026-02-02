import { getConnection } from '../database/database.js';

const fixSchemaSafely = async () => {
    let connection;
    try {
        console.log("Iniciando migración segura de detalle_envio...");
        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Crear tabla temporal con la nueva estructura
        // Incluimos id_detalle como PK AUTO_INCREMENT
        // Incluimos id_sku, id_tonalidad, id_talla explícitamente si no estaban todos
        await connection.query(`
            CREATE TABLE detalle_envio_new LIKE detalle_envio;
        `);
        console.log("Tabla temporal creada.");

        // 2. Modificar la estructura de la nueva tabla ANTES de insertar datos
        try {
            await connection.query("ALTER TABLE detalle_envio_new DROP PRIMARY KEY");
        } catch (e) {
            console.log("No se pudo borrar PK en new (quizas no tenia?), continuando...", e.message);
        }

        await connection.query(`
            ALTER TABLE detalle_envio_new 
            ADD COLUMN id_detalle INT AUTO_INCREMENT PRIMARY KEY FIRST;
        `);
        console.log("Estructura de tabla temporal ajustada.");

        // 3. Copiar datos
        // Mapeamos columnas explícitamente para evitar errores de orden
        // Obtenemos columnas de la tabla original
        const [cols] = await connection.query("SHOW COLUMNS FROM detalle_envio");
        const colNames = cols.map(c => c.Field).filter(c => c !== 'id_detalle').join(', ');

        await connection.query(`
            INSERT INTO detalle_envio_new (${colNames})
            SELECT ${colNames} FROM detalle_envio
        `);
        console.log("Datos copiados.");

        // 4. Renombrar tablas (Swap)
        await connection.query("RENAME TABLE detalle_envio TO detalle_envio_old, detalle_envio_new TO detalle_envio");
        console.log("Tablas intercambiadas.");

        // 5. Commit
        await connection.commit();
        console.log("Migración completada exitosamente.");

        // 6. Limpiar (opcional, dejamos old por seguridad un momento)
        // await connection.query("DROP TABLE detalle_envio_old");

    } catch (e) {
        if (connection) await connection.rollback();
        console.error("Error crítico durante la migración:", e);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

fixSchemaSafely();
