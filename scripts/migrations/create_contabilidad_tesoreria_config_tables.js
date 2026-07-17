import { getConnection } from "../../src/database/database.js";

/**
 * Segunda tanda del núcleo contable: configuración contable (mapeo concepto->cuenta),
 * tesorería (cajas/bancos + movimientos + cierre de caja) y presupuestos.
 * Se apoya en las tablas de create_contabilidad_nucleo_tables.js (cuenta_contable,
 * centro_costo, asiento_contable) — córrela después de esa.
 *
 * Estados Financieros, Auditoría Contable y el Dashboard NO tienen tablas propias:
 * se derivan de las tablas ya existentes (cuenta_contable/asiento_detalle/audit_log).
 *
 * Simplificación deliberada: `contabilidad_config` es un catálogo de mapeo que los
 * módulos de ventas/gastos podrían usar para no hardcodear cuentas en el código, pero
 * este corte NO conecta ventas/gastos a la contabilización automática (eso implica
 * tocar el flujo de ventas, adyacente a SUNAT — requiere confirmación aparte).
 *
 * Idempotente: se puede correr más de una vez sin duplicar filas.
 */
async function run() {
    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        console.log("Creando tablas de configuración contable, tesorería y presupuestos...");

        await connection.query(`
            CREATE TABLE IF NOT EXISTS contabilidad_config (
                id_config    INT NOT NULL AUTO_INCREMENT,
                id_tenant    INT UNSIGNED NOT NULL,
                concepto     VARCHAR(60) NOT NULL,
                descripcion  VARCHAR(150) NULL,
                id_cuenta    INT NOT NULL,
                f_creacion   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_config),
                UNIQUE KEY uq_config_tenant_concepto (id_tenant, concepto),
                INDEX idx_config_tenant (id_tenant),
                CONSTRAINT fk_config_cuenta FOREIGN KEY (id_cuenta) REFERENCES cuenta_contable(id_cuenta)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS cuenta_tesoreria (
                id_cuenta_tesoreria INT NOT NULL AUTO_INCREMENT,
                id_tenant           INT UNSIGNED NOT NULL,
                tipo                ENUM('caja','banco') NOT NULL,
                nombre              VARCHAR(100) NOT NULL,
                numero_cuenta       VARCHAR(50) NULL,
                id_cuenta_contable  INT NOT NULL,
                id_sucursal         INT NULL,
                estado              TINYINT(1) NOT NULL DEFAULT 1,
                f_creacion          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_cuenta_tesoreria),
                INDEX idx_tesoreria_tenant (id_tenant),
                CONSTRAINT fk_tesoreria_cuenta FOREIGN KEY (id_cuenta_contable) REFERENCES cuenta_contable(id_cuenta)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS movimiento_tesoreria (
                id_movimiento        INT NOT NULL AUTO_INCREMENT,
                id_tenant            INT UNSIGNED NOT NULL,
                id_cuenta_tesoreria  INT NOT NULL,
                fecha                DATE NOT NULL,
                tipo                 ENUM('deposito','retiro','transferencia_entrada','transferencia_salida','ajuste') NOT NULL,
                monto                DECIMAL(14,2) NOT NULL,
                descripcion          VARCHAR(255) NULL,
                referencia           VARCHAR(100) NULL,
                id_asiento           INT NULL,
                conciliado           TINYINT(1) NOT NULL DEFAULT 0,
                fecha_conciliacion   DATETIME NULL,
                creado_por           INT NOT NULL,
                f_creacion           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_movimiento),
                INDEX idx_movtesoreria_tenant_fecha (id_tenant, fecha),
                INDEX idx_movtesoreria_cuenta (id_cuenta_tesoreria),
                CONSTRAINT fk_movtesoreria_cuenta FOREIGN KEY (id_cuenta_tesoreria) REFERENCES cuenta_tesoreria(id_cuenta_tesoreria),
                CONSTRAINT fk_movtesoreria_asiento FOREIGN KEY (id_asiento) REFERENCES asiento_contable(id_asiento)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS cierre_caja (
                id_cierre           INT NOT NULL AUTO_INCREMENT,
                id_tenant           INT UNSIGNED NOT NULL,
                id_cuenta_tesoreria INT NOT NULL,
                fecha               DATE NOT NULL,
                saldo_inicial       DECIMAL(14,2) NOT NULL,
                total_ingresos      DECIMAL(14,2) NOT NULL,
                total_egresos       DECIMAL(14,2) NOT NULL,
                saldo_final         DECIMAL(14,2) NOT NULL,
                observacion         VARCHAR(255) NULL,
                cerrado_por         INT NOT NULL,
                cerrado_en          DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_cierre),
                UNIQUE KEY uq_cierre_cuenta_fecha (id_cuenta_tesoreria, fecha),
                INDEX idx_cierre_tenant (id_tenant),
                CONSTRAINT fk_cierre_cuenta FOREIGN KEY (id_cuenta_tesoreria) REFERENCES cuenta_tesoreria(id_cuenta_tesoreria)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS presupuesto (
                id_presupuesto      INT NOT NULL AUTO_INCREMENT,
                id_tenant           INT UNSIGNED NOT NULL,
                id_cuenta           INT NOT NULL,
                id_centro_costo     INT NULL,
                anio                SMALLINT NOT NULL,
                mes                 TINYINT NULL,
                monto_presupuestado DECIMAL(14,2) NOT NULL,
                f_creacion          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_presupuesto),
                UNIQUE KEY uq_presupuesto (id_tenant, id_cuenta, id_centro_costo, anio, mes),
                INDEX idx_presupuesto_tenant (id_tenant),
                CONSTRAINT fk_presupuesto_cuenta FOREIGN KEY (id_cuenta) REFERENCES cuenta_contable(id_cuenta),
                CONSTRAINT fk_presupuesto_centro FOREIGN KEY (id_centro_costo) REFERENCES centro_costo(id_centro_costo)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        console.log("Registrando submódulos nuevos de Contabilidad...");
        const [existingModulo] = await connection.query(
            "SELECT id_modulo FROM modulo WHERE ruta = '/contabilidad' LIMIT 1"
        );
        if (existingModulo.length === 0) {
            throw new Error("No se encontró el módulo '/contabilidad'. Corre primero create_contabilidad_tables.js.");
        }
        const idModulo = existingModulo[0].id_modulo;

        const submodulos = [
            { nombre: "Configuración Contable", ruta: "/contabilidad/configuracion" },
            { nombre: "Tesorería", ruta: "/contabilidad/tesoreria" },
            { nombre: "Presupuestos", ruta: "/contabilidad/presupuestos" },
            { nombre: "Estados Financieros", ruta: "/contabilidad/estados-financieros" },
            { nombre: "Auditoría Contable", ruta: "/contabilidad/auditoria" },
        ];

        const idSubmoduloByRuta = {};
        for (const sub of submodulos) {
            const [existing] = await connection.query(
                "SELECT id_submodulo FROM submodulos WHERE id_modulo = ? AND ruta = ? LIMIT 1",
                [idModulo, sub.ruta]
            );
            if (existing.length > 0) {
                idSubmoduloByRuta[sub.ruta] = existing[0].id_submodulo;
                console.log(`  "${sub.nombre}" ya existía (id_submodulo=${existing[0].id_submodulo}).`);
                continue;
            }
            const [result] = await connection.query(
                "INSERT INTO submodulos (id_modulo, nombre_sub, ruta) VALUES (?, ?, ?)",
                [idModulo, sub.nombre, sub.ruta]
            );
            idSubmoduloByRuta[sub.ruta] = result.insertId;
            console.log(`  Creado "${sub.nombre}" (id_submodulo=${result.insertId}).`);
        }

        console.log("Otorgando permiso completo al rol Admin (id_rol=1) del tenant 1 para pruebas...");
        for (const idSubmodulo of Object.values(idSubmoduloByRuta)) {
            const [existingPerm] = await connection.query(
                "SELECT id_permiso FROM permisos WHERE id_rol = 1 AND id_tenant = 1 AND id_modulo = ? AND id_submodulo = ?",
                [idModulo, idSubmodulo]
            );
            if (existingPerm.length > 0) continue;
            await connection.query(
                `INSERT INTO permisos (id_rol, id_modulo, id_submodulo, crear, ver, editar, eliminar, desactivar, generar, id_tenant, id_plan)
                 VALUES (1, ?, ?, 1, 1, 1, 1, 0, 0, 1, NULL)`,
                [idModulo, idSubmodulo]
            );
        }
        console.log("  Permisos otorgados.");

        await connection.commit();
        console.log("Migración de tesorería/config/presupuestos completada.");
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Migración falló:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
