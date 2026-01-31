import { getConnection } from "../../src/database/database.js";

const runMigration = async () => {
    let connection;
    try {
        console.log("Iniciando migración de esquema para soporte de variantes...");
        connection = await getConnection();

        // --- 1. INVENTARIO ---
        console.log("Migrando tabla `inventario`...");

        // Verificar columnas existentes
        const [invCols] = await connection.query("SHOW COLUMNS FROM inventario");
        const hasIdInventario = invCols.some(c => c.Field === 'id_inventario');

        if (!hasIdInventario) {
            console.log("Agregando id_inventario...");
            try {
                // Intentar borrar PK existente primero
                await connection.query("ALTER TABLE inventario DROP PRIMARY KEY");
                console.log("PK antigua eliminada.");
            } catch (e) {
                console.log("Nota (Drop PK Inv):", e.message);
            }

            try {
                await connection.query("ALTER TABLE inventario ADD COLUMN id_inventario INT AUTO_INCREMENT PRIMARY KEY FIRST");
                console.log("Columna id_inventario agregada.");
            } catch (e) {
                console.error("Error agregando id_inventario:", e.message);
                // Si falla por 'Multiple primary key', asumimos que id_inventario ya es PK o hay un lio.
            }
        } else {
            console.log("id_inventario ya existe.");
        }

        // Crear índice único
        try {
            await connection.query("CREATE UNIQUE INDEX idx_inventario_variant ON inventario (id_producto, id_almacen, id_tonalidad, id_talla, id_tenant)");
            console.log("Index idx_inventario_variant creado.");
        } catch (e) {
            console.log("Nota (Index Inv):", e.message);
        }

        // --- 2. DETALLE_VENTA ---
        console.log("Migrando tabla `detalle_venta`...");
        const [dvCols] = await connection.query("SHOW COLUMNS FROM detalle_venta");
        const hasIdTonDV = dvCols.some(c => c.Field === 'id_tonalidad');

        if (!hasIdTonDV) {
            try {
                await connection.query("ALTER TABLE detalle_venta ADD COLUMN id_tonalidad INT DEFAULT NULL, ADD COLUMN id_talla INT DEFAULT NULL");
                console.log("Columnas variantes agregadas a detalle_venta.");
            } catch (e) {
                console.error("Error agregando cols a detalle_venta:", e.message);
            }
        } else {
            console.log("Columnas variantes ya existen en detalle_venta.");
        }

        // --- 3. DETALLE_ENVIO ---
        console.log("Migrando tabla `detalle_envio`...");
        const [deCols] = await connection.query("SHOW COLUMNS FROM detalle_envio");
        const hasIdDetalleEnvio = deCols.some(c => c.Field === 'id_detalle_envio');
        const hasIdTonDE = deCols.some(c => c.Field === 'id_tonalidad');

        if (!hasIdDetalleEnvio) {
            console.log("Agregando id_detalle_envio...");
            try {
                await connection.query("ALTER TABLE detalle_envio DROP PRIMARY KEY");
                console.log("PK antigua detalle_envio eliminada.");
            } catch (e) {
                console.log("Nota (Drop PK DE):", e.message);
            }

            try {
                await connection.query("ALTER TABLE detalle_envio ADD COLUMN id_detalle_envio INT AUTO_INCREMENT PRIMARY KEY FIRST");
                console.log("Columna id_detalle_envio agregada.");
            } catch (e) {
                console.error("Error agregando id_detalle_envio:", e.message);
            }
        } else {
            console.log("id_detalle_envio ya existe.");
        }

        if (!hasIdTonDE) {
            try {
                await connection.query("ALTER TABLE detalle_envio ADD COLUMN id_tonalidad INT DEFAULT NULL, ADD COLUMN id_talla INT DEFAULT NULL");
                console.log("Columnas variantes agregadas a detalle_envio.");
            } catch (e) {
                console.error("Error agregando cols a detalle_envio:", e.message);
            }
        } else {
            console.log("Columnas variantes ya existen en detalle_envio.");
        }

        try {
            await connection.query("CREATE UNIQUE INDEX idx_detalle_envio_variant ON detalle_envio (id_guiaremision, id_producto, id_tonalidad, id_talla, id_tenant)");
            console.log("Index idx_detalle_envio_variant creado.");
        } catch (e) {
            console.log("Nota (Index DE):", e.message);
        }

        console.log("Migración finalizada.");

    } catch (error) {
        console.error("Error general:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
};

runMigration();
