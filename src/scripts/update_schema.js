import { getConnection } from "../database/database.js";

const updateSchema = async () => {
    let connection;
    try {
        console.log("Conectando a la base de datos...");
        connection = await getConnection();

        console.log("Iniciando actualización de esquema...");

        // 1. Crear tabla tonalidad
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tonalidad (
                id_tonalidad INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                id_tenant INT,
                INDEX idx_tenant (id_tenant)
            )
        `);
        console.log("Tabla 'tonalidad' creada/verificada.");

        // 2. Crear tabla talla
        await connection.query(`
            CREATE TABLE IF NOT EXISTS talla (
                id_talla INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                id_tenant INT,
                INDEX idx_tenant (id_tenant)
            )
        `);
        console.log("Tabla 'talla' creada/verificada.");

        // 3. Crear tabla producto_tonalidad
        await connection.query(`
            CREATE TABLE IF NOT EXISTS producto_tonalidad (
                id_producto INT,
                id_tonalidad INT,
                PRIMARY KEY (id_producto, id_tonalidad),
                FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE,
                FOREIGN KEY (id_tonalidad) REFERENCES tonalidad(id_tonalidad) ON DELETE CASCADE
            )
        `);
        console.log("Tabla 'producto_tonalidad' creada/verificada.");

        // 4. Crear tabla producto_talla
        await connection.query(`
            CREATE TABLE IF NOT EXISTS producto_talla (
                id_producto INT,
                id_talla INT,
                PRIMARY KEY (id_producto, id_talla),
                FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE,
                FOREIGN KEY (id_talla) REFERENCES talla(id_talla) ON DELETE CASCADE
            )
        `);
        console.log("Tabla 'producto_talla' creada/verificada.");

        // 5. Crear tabla lote_inventario
        await connection.query(`
            CREATE TABLE IF NOT EXISTS lote_inventario (
                id_lote INT AUTO_INCREMENT PRIMARY KEY,
                descripcion TEXT,
                estado INT DEFAULT 0 COMMENT '0: Pendiente Verificación, 1: Pendiente Aprobación, 2: Aprobado',
                id_usuario_crea INT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                id_usuario_verifica INT,
                fecha_verificacion DATETIME,
                id_usuario_aprueba INT,
                fecha_aprobacion DATETIME,
                id_tenant INT,
                INDEX idx_tenant (id_tenant)
            )
        `);
        console.log("Tabla 'lote_inventario' creada/verificada.");

        // 6. Crear tabla detalle_lote_inventario
        await connection.query(`
            CREATE TABLE IF NOT EXISTS detalle_lote_inventario (
                id_detalle_lote INT AUTO_INCREMENT PRIMARY KEY,
                id_lote INT,
                id_producto INT,
                id_tonalidad INT,
                id_talla INT,
                cantidad DECIMAL(10,2),
                id_tenant INT,
                FOREIGN KEY (id_lote) REFERENCES lote_inventario(id_lote) ON DELETE CASCADE,
                INDEX idx_tenant (id_tenant)
            )
        `);
        console.log("Tabla 'detalle_lote_inventario' creada/verificada.");

        // 7. Modificar tabla detalle_nota
        // Verificar si columnas existen antes de intentar agregarlas (MySQL no tiene ADD IF NOT EXISTS para columnas nativo en una linea simple sin procedures, asi que usaremos try/catch o ignore)
        try {
            await connection.query(`ALTER TABLE detalle_nota ADD COLUMN id_tonalidad INT DEFAULT NULL`);
            console.log("Columna 'id_tonalidad' agregada a 'detalle_nota'.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error agregando id_tonalidad a detalle_nota:", e.message);
            else console.log("Columna 'id_tonalidad' ya existe en 'detalle_nota'.");
        }

        try {
            await connection.query(`ALTER TABLE detalle_nota ADD COLUMN id_talla INT DEFAULT NULL`);
            console.log("Columna 'id_talla' agregada a 'detalle_nota'.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error agregando id_talla a detalle_nota:", e.message);
            else console.log("Columna 'id_talla' ya existe en 'detalle_nota'.");
        }

        // 8. Modificar tabla inventario
        try {
            await connection.query(`ALTER TABLE inventario ADD COLUMN id_tonalidad INT DEFAULT NULL AFTER id_almacen`);
            console.log("Columna 'id_tonalidad' agregada a 'inventario'.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error agregando id_tonalidad a inventario:", e.message);
            else console.log("Columna 'id_tonalidad' ya existe en 'inventario'.");
        }

        try {
            await connection.query(`ALTER TABLE inventario ADD COLUMN id_talla INT DEFAULT NULL AFTER id_tonalidad`);
            console.log("Columna 'id_talla' agregada a 'inventario'.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error agregando id_talla a inventario:", e.message);
            else console.log("Columna 'id_talla' ya existe en 'inventario'.");
        }

        // 9. Modificar tabla bitacora_nota
        try {
            await connection.query(`ALTER TABLE bitacora_nota ADD COLUMN id_tonalidad INT DEFAULT NULL`);
            console.log("Columna 'id_tonalidad' agregada a 'bitacora_nota'.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error agregando id_tonalidad a bitacora_nota:", e.message);
            else console.log("Columna 'id_tonalidad' ya existe en 'bitacora_nota'.");
        }

        try {
            await connection.query(`ALTER TABLE bitacora_nota ADD COLUMN id_talla INT DEFAULT NULL`);
            console.log("Columna 'id_talla' agregada a 'bitacora_nota'.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error agregando id_talla a bitacora_nota:", e.message);
            else console.log("Columna 'id_talla' ya existe en 'bitacora_nota'.");
        }

        // 10. Modificar tabla nota si es necesario (estado_espera ya existe según análisis, pero verificamos)
        try {
            await connection.query(`ALTER TABLE nota MODIFY COLUMN estado_espera INT DEFAULT 0`);
            console.log("Columna 'estado_espera' verificada en 'nota'.");
        } catch (e) {
            console.log("Error verificando 'estado_espera' en 'nota' (probablemente ya existe):", e.message);
        }

        console.log("Actualización de esquema completada exitosamente.");

    } catch (error) {
        console.error("Error critico actualizando esquema:", error);
    } finally {
        if (connection) {
            connection.end(); // Usar end() para scripts one-off
        }
        process.exit();
    }
};

updateSchema();
