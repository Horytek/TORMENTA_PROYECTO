import { getConnection } from "../../src/database/database.js";

/**
 * Sección 1 (núcleo) del roadmap de Contabilidad: plan de cuentas + asientos
 * de partida doble + libro diario/mayor + periodos contables. Se apoya en el
 * módulo "Contabilidad" (/contabilidad) creado por create_contabilidad_tables.js
 * (gastos/P&L) — no lo duplica, le agrega submódulos nuevos.
 *
 * Crea:
 *   - cuenta_contable, centro_costo, periodo_contable, asiento_contable, asiento_detalle
 *   - submódulos nuevos bajo el módulo Contabilidad existente
 *   - permiso completo al rol Admin (id_rol=1) del tenant 1, para pruebas
 *   - plan de cuentas básico + periodo contable abierto (mes actual) por cada tenant existente
 *
 * Simplificaciones deliberadas de este primer corte (quedan para iteraciones futuras):
 *   - Un solo tipo de moneda por cuenta (la de la empresa), sin motor multi-divisa/tasa de cambio.
 *   - Plan de cuentas inicial mínimo (no el PCGE completo) — se amplía desde la UI.
 *   - Sin FK cruzada hacia tablas de otros módulos (usuario, cliente, sucursal) seguendo el mismo
 *     criterio que create_contabilidad_tables.js con `gasto.id_usuario`.
 *
 * Idempotente: se puede correr más de una vez sin duplicar filas.
 */
async function run() {
    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        console.log("Creando tablas del núcleo contable...");

        await connection.query(`
            CREATE TABLE IF NOT EXISTS centro_costo (
                id_centro_costo INT NOT NULL AUTO_INCREMENT,
                id_tenant       INT UNSIGNED NOT NULL,
                codigo          VARCHAR(20) NOT NULL,
                nombre          VARCHAR(100) NOT NULL,
                id_sucursal     INT NULL,
                estado          TINYINT(1) NOT NULL DEFAULT 1,
                f_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_centro_costo),
                UNIQUE KEY uq_centrocosto_tenant_codigo (id_tenant, codigo),
                INDEX idx_centrocosto_tenant (id_tenant)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS cuenta_contable (
                id_cuenta          INT NOT NULL AUTO_INCREMENT,
                id_tenant          INT UNSIGNED NOT NULL,
                codigo             VARCHAR(20) NOT NULL,
                nombre             VARCHAR(150) NOT NULL,
                id_cuenta_padre    INT NULL,
                tipo               ENUM('activo','pasivo','patrimonio','ingreso','costo','gasto','orden') NOT NULL,
                naturaleza         ENUM('deudora','acreedora') NOT NULL,
                nivel              TINYINT NOT NULL DEFAULT 1,
                moneda             VARCHAR(3) NOT NULL DEFAULT 'PEN',
                estado             TINYINT(1) NOT NULL DEFAULT 1,
                es_conciliable     TINYINT(1) NOT NULL DEFAULT 0,
                es_presupuestable  TINYINT(1) NOT NULL DEFAULT 0,
                es_auxiliar        TINYINT(1) NOT NULL DEFAULT 0,
                permite_movimiento TINYINT(1) NOT NULL DEFAULT 1,
                f_creacion         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_cuenta),
                UNIQUE KEY uq_cuenta_tenant_codigo (id_tenant, codigo),
                INDEX idx_cuenta_tenant (id_tenant),
                INDEX idx_cuenta_padre (id_cuenta_padre),
                CONSTRAINT fk_cuenta_padre FOREIGN KEY (id_cuenta_padre) REFERENCES cuenta_contable(id_cuenta)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS periodo_contable (
                id_periodo        INT NOT NULL AUTO_INCREMENT,
                id_tenant         INT UNSIGNED NOT NULL,
                anio              SMALLINT NOT NULL,
                mes               TINYINT NOT NULL,
                fecha_inicio      DATE NOT NULL,
                fecha_fin         DATE NOT NULL,
                estado            ENUM('abierto','cerrado','bloqueado') NOT NULL DEFAULT 'abierto',
                cerrado_por       INT NULL,
                cerrado_en        DATETIME NULL,
                motivo_reapertura VARCHAR(255) NULL,
                f_creacion        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_periodo),
                UNIQUE KEY uq_periodo_tenant_anio_mes (id_tenant, anio, mes),
                INDEX idx_periodo_tenant (id_tenant)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS asiento_contable (
                id_asiento         INT NOT NULL AUTO_INCREMENT,
                id_tenant          INT UNSIGNED NOT NULL,
                numero             INT NOT NULL,
                fecha              DATE NOT NULL,
                id_periodo         INT NOT NULL,
                tipo               ENUM('manual','automatico','apertura','ajuste','cierre','reversion') NOT NULL DEFAULT 'manual',
                descripcion        VARCHAR(255) NOT NULL,
                documento_origen   VARCHAR(100) NULL,
                estado             ENUM('contabilizado','anulado','revertido') NOT NULL DEFAULT 'contabilizado',
                id_asiento_reversa INT NULL,
                creado_por         INT NOT NULL,
                contabilizado_por  INT NULL,
                contabilizado_en   DATETIME NULL,
                f_creacion         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_asiento),
                UNIQUE KEY uq_asiento_tenant_numero (id_tenant, numero),
                INDEX idx_asiento_tenant_fecha (id_tenant, fecha),
                INDEX idx_asiento_periodo (id_periodo),
                CONSTRAINT fk_asiento_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_contable(id_periodo),
                CONSTRAINT fk_asiento_reversa FOREIGN KEY (id_asiento_reversa) REFERENCES asiento_contable(id_asiento)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS asiento_detalle (
                id_detalle      INT NOT NULL AUTO_INCREMENT,
                id_asiento      INT NOT NULL,
                orden           SMALLINT NOT NULL DEFAULT 0,
                id_cuenta       INT NOT NULL,
                id_centro_costo INT NULL,
                id_cliente      INT NULL,
                descripcion     VARCHAR(255) NULL,
                debe            DECIMAL(14,2) NOT NULL DEFAULT 0,
                haber           DECIMAL(14,2) NOT NULL DEFAULT 0,
                PRIMARY KEY (id_detalle),
                INDEX idx_detalle_asiento (id_asiento),
                INDEX idx_detalle_cuenta (id_cuenta),
                CONSTRAINT fk_detalle_asiento FOREIGN KEY (id_asiento) REFERENCES asiento_contable(id_asiento) ON DELETE CASCADE,
                CONSTRAINT fk_detalle_cuenta FOREIGN KEY (id_cuenta) REFERENCES cuenta_contable(id_cuenta),
                CONSTRAINT fk_detalle_centrocosto FOREIGN KEY (id_centro_costo) REFERENCES centro_costo(id_centro_costo)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        console.log("Registrando submódulos de Contabilidad...");
        const [existingModulo] = await connection.query(
            "SELECT id_modulo FROM modulo WHERE ruta = '/contabilidad' LIMIT 1"
        );
        if (existingModulo.length === 0) {
            throw new Error("No se encontró el módulo '/contabilidad'. Corre primero create_contabilidad_tables.js.");
        }
        const idModulo = existingModulo[0].id_modulo;

        const submodulos = [
            { nombre: "Plan de Cuentas", ruta: "/contabilidad/cuentas" },
            { nombre: "Centros de Costo", ruta: "/contabilidad/centros-costo" },
            { nombre: "Periodos Contables", ruta: "/contabilidad/periodos" },
            { nombre: "Asientos Contables", ruta: "/contabilidad/asientos" },
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

        console.log("Sembrando plan de cuentas básico y periodo abierto por tenant...");
        const [tenants] = await connection.query("SELECT id_tenant, moneda FROM empresa WHERE id_tenant IS NOT NULL");

        // [codigo, nombre, tipo, naturaleza, nivel, permite_movimiento, es_conciliable, codigoPadre]
        const planBasico = [
            ["1", "ACTIVO", "activo", "deudora", 1, 0, 0, null],
            ["10", "Activo Corriente", "activo", "deudora", 2, 0, 0, "1"],
            ["101", "Caja y Bancos", "activo", "deudora", 3, 1, 1, "10"],
            ["102", "Cuentas por Cobrar Comerciales", "activo", "deudora", 3, 1, 0, "10"],
            ["103", "Inventarios", "activo", "deudora", 3, 1, 0, "10"],
            ["2", "PASIVO", "pasivo", "acreedora", 1, 0, 0, null],
            ["20", "Pasivo Corriente", "pasivo", "acreedora", 2, 0, 0, "2"],
            ["201", "Cuentas por Pagar Comerciales", "pasivo", "acreedora", 3, 1, 0, "20"],
            ["202", "Tributos por Pagar", "pasivo", "acreedora", 3, 1, 0, "20"],
            ["3", "PATRIMONIO", "patrimonio", "acreedora", 1, 0, 0, null],
            ["301", "Capital", "patrimonio", "acreedora", 2, 1, 0, "3"],
            ["302", "Resultados Acumulados", "patrimonio", "acreedora", 2, 1, 0, "3"],
            ["4", "INGRESOS", "ingreso", "acreedora", 1, 0, 0, null],
            ["401", "Ventas", "ingreso", "acreedora", 2, 1, 0, "4"],
            ["5", "COSTOS", "costo", "deudora", 1, 0, 0, null],
            ["501", "Costo de Ventas", "costo", "deudora", 2, 1, 0, "5"],
            ["6", "GASTOS", "gasto", "deudora", 1, 0, 0, null],
            ["601", "Gastos Administrativos", "gasto", "deudora", 2, 1, 0, "6"],
            ["602", "Gastos de Ventas", "gasto", "deudora", 2, 1, 0, "6"],
            ["9", "CUENTAS DE ORDEN", "orden", "deudora", 1, 0, 0, null],
            ["901", "Cuentas de Orden Deudoras", "orden", "deudora", 2, 1, 0, "9"],
        ];

        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = hoy.getMonth() + 1;
        const fechaInicio = `${anio}-${String(mes).padStart(2, "0")}-01`;
        const fechaFin = new Date(anio, mes, 0).toISOString().slice(0, 10);

        for (const { id_tenant, moneda } of tenants) {
            const [already] = await connection.query(
                "SELECT COUNT(*) as n FROM cuenta_contable WHERE id_tenant = ?",
                [id_tenant]
            );
            if (already[0].n === 0) {
                const idCuentaPorCodigo = {};
                for (const [codigo, nombre, tipo, naturaleza, nivel, permiteMov, esConciliable, codigoPadre] of planBasico) {
                    const idPadre = codigoPadre ? idCuentaPorCodigo[codigoPadre] : null;
                    const [result] = await connection.query(
                        `INSERT INTO cuenta_contable
                            (id_tenant, codigo, nombre, id_cuenta_padre, tipo, naturaleza, nivel, moneda, permite_movimiento, es_conciliable)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [id_tenant, codigo, nombre, idPadre, tipo, naturaleza, nivel, moneda || "PEN", permiteMov, esConciliable]
                    );
                    idCuentaPorCodigo[codigo] = result.insertId;
                }
                console.log(`  Tenant ${id_tenant}: plan de cuentas básico sembrado (${planBasico.length} cuentas).`);
            }

            const [yaPeriodo] = await connection.query(
                "SELECT id_periodo FROM periodo_contable WHERE id_tenant = ? AND anio = ? AND mes = ?",
                [id_tenant, anio, mes]
            );
            if (yaPeriodo.length === 0) {
                await connection.query(
                    "INSERT INTO periodo_contable (id_tenant, anio, mes, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?, 'abierto')",
                    [id_tenant, anio, mes, fechaInicio, fechaFin]
                );
                console.log(`  Tenant ${id_tenant}: periodo ${anio}-${String(mes).padStart(2, "0")} abierto.`);
            }
        }

        await connection.commit();
        console.log("Migración del núcleo contable completada.");
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Migración falló:", error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

run();
