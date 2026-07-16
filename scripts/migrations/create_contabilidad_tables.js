import { getConnection } from "../../src/database/database.js";

/**
 * Fase 4 del roadmap client-v2: módulo de Contabilidad (versión simple —
 * gastos/egresos + P&L, sin plan de cuentas de partida doble).
 *
 * Crea:
 *   - gasto_categoria / gasto (tablas nuevas)
 *   - fila en `modulo` (ruta "/contabilidad", id_tenant NULL = global,
 *     mismo patrón que Inventario/Guía de Remisión/Nota de Almacén)
 *   - fila en `permisos` para el rol Admin (id_rol=1) del tenant 1, para que
 *     el módulo aparezca de inmediato sin pasos manuales adicionales
 *   - categorías de gasto por defecto para cada tenant ya existente
 *
 * Idempotente: se puede correr más de una vez sin duplicar filas.
 */
async function run() {
    let connection;
    try {
        console.log("Creando tablas de Contabilidad (gasto_categoria, gasto)...");
        connection = await getConnection();
        await connection.beginTransaction();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS gasto_categoria (
                id_categoria  INT NOT NULL AUTO_INCREMENT,
                id_tenant     INT UNSIGNED NOT NULL,
                nombre        VARCHAR(100) NOT NULL,
                estado        TINYINT(1) NOT NULL DEFAULT 1,
                f_creacion    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_categoria),
                INDEX idx_gastocat_tenant (id_tenant)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS gasto (
                id_gasto      INT NOT NULL AUTO_INCREMENT,
                id_tenant     INT UNSIGNED NOT NULL,
                id_categoria  INT NOT NULL,
                descripcion   VARCHAR(255) NOT NULL,
                monto         DECIMAL(10,2) NOT NULL,
                fecha         DATE NOT NULL,
                id_usuario    INT NOT NULL,
                estado        TINYINT(1) NOT NULL DEFAULT 1,
                f_creacion    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_gasto),
                INDEX idx_gasto_tenant (id_tenant),
                INDEX idx_gasto_fecha (fecha),
                CONSTRAINT fk_gasto_categoria FOREIGN KEY (id_categoria) REFERENCES gasto_categoria(id_categoria)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        console.log("Registrando módulo 'Contabilidad' en el catálogo de navegación...");
        const [existingModulo] = await connection.query(
            "SELECT id_modulo FROM modulo WHERE ruta = '/contabilidad' LIMIT 1"
        );
        let idModulo;
        if (existingModulo.length > 0) {
            idModulo = existingModulo[0].id_modulo;
            console.log(`  Ya existía (id_modulo=${idModulo}), no se duplica.`);
        } else {
            const [result] = await connection.query(
                "INSERT INTO modulo (nombre_modulo, ruta, id_tenant) VALUES (?, ?, NULL)",
                ["Contabilidad", "/contabilidad"]
            );
            idModulo = result.insertId;
            console.log(`  Creado id_modulo=${idModulo}.`);
        }

        console.log("Otorgando permiso completo al rol Admin (id_rol=1) del tenant 1 para pruebas...");
        const [existingPerm] = await connection.query(
            "SELECT id_permiso FROM permisos WHERE id_rol = 1 AND id_tenant = 1 AND id_modulo = ? AND id_submodulo IS NULL",
            [idModulo]
        );
        if (existingPerm.length > 0) {
            console.log("  Ya existía, no se duplica.");
        } else {
            await connection.query(
                `INSERT INTO permisos (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, id_tenant, id_plan)
                 VALUES (1, ?, NULL, 1, 1, 1, 1, 0, 0, 1, NULL)`,
                [idModulo]
            );
            console.log("  Permiso otorgado.");
        }

        console.log("Sembrando categorías de gasto por defecto para tenants existentes...");
        const [tenants] = await connection.query("SELECT DISTINCT id_tenant FROM empresa WHERE id_tenant IS NOT NULL");
        const defaultCategorias = ["Alquiler", "Servicios", "Planilla", "Insumos", "Otros"];
        for (const { id_tenant } of tenants) {
            const [already] = await connection.query(
                "SELECT COUNT(*) as n FROM gasto_categoria WHERE id_tenant = ?",
                [id_tenant]
            );
            if (already[0].n > 0) continue;
            const values = defaultCategorias.map((n) => [id_tenant, n]);
            await connection.query(
                "INSERT INTO gasto_categoria (id_tenant, nombre) VALUES ?",
                [values]
            );
            console.log(`  Tenant ${id_tenant}: ${defaultCategorias.length} categorías sembradas.`);
        }

        await connection.commit();
        console.log("Migración de Contabilidad completada.");
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Migración falló:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
