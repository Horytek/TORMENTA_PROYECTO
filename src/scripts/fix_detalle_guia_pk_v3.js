import { getConnection } from '../database/database.js';

const fixSchemaV3 = async () => {
    let connection;
    try {
        console.log("Iniciando migración V3 de detalle_envio...");
        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Obtener CREATE TABLE original para ver definicion
        const [showRes] = await connection.query("SHOW CREATE TABLE detalle_envio");
        let createStmt = showRes[0]['Create Table'];

        console.log("Definición original:", createStmt);

        // 2. Crear tabla nueva DE CERO con id_detalle
        // Asumimos estructura común, pero mejor inspeccionar las columnas para generar el script
        const [columns] = await connection.query("SHOW COLUMNS FROM detalle_envio");

        // Construir definición de columnas
        let colDefs = [];
        let colNames = [];

        for (const col of columns) {
            colNames.push(col.Field);

            // Skip id_detalle if exists (should not, but just in case)
            if (col.Field === 'id_detalle') continue;

            let def = `${col.Field} ${col.Type}`;
            if (col.Null === 'NO') def += ' NOT NULL';
            // Default logic simplificada (puede requerir más detalle si hay CURRENT_TIMESTAMP etc, pero para INT/VARCHAR básico ok)
            if (col.Default) def += ` DEFAULT '${col.Default}'`;

            colDefs.push(def);
        }

        // Definir nueva tabla
        await connection.query("DROP TABLE IF EXISTS detalle_envio_new");

        const newTableSql = `
            CREATE TABLE detalle_envio_new (
                id_detalle INT AUTO_INCREMENT PRIMARY KEY,
                ${colDefs.join(',\n')},
                INDEX idx_guia (id_guiaremision),
                INDEX idx_prod (id_producto)
            )
        `;

        console.log("Creando nueva tabla con:", newTableSql);
        await connection.query(newTableSql);

        // 3. Copiar datos
        const colsStr = colNames.join(', ');
        await connection.query(`
            INSERT INTO detalle_envio_new (${colsStr})
            SELECT ${colsStr} FROM detalle_envio
        `);
        console.log("Datos copiados.");

        // 4. Swap
        await connection.query("RENAME TABLE detalle_envio TO detalle_envio_old_v3, detalle_envio_new TO detalle_envio");
        console.log("Tablas intercambiadas.");

        await connection.commit();
        console.log("Migración V3 Exitosa.");

    } catch (e) {
        if (connection) await connection.rollback();
        console.error("Error V3:", e);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

fixSchemaV3();
