import { getConnection } from "../database/database.js";
import { logAudit } from "../utils/auditLogger.js";

const INFLOW_TYPES = new Set(["deposito", "transferencia_entrada", "ajuste"]);

// ─────────────────────────────────────────────────────────────────
// Cuentas de tesorería (cajas y bancos)
// ─────────────────────────────────────────────────────────────────
const getCuentasTesoreria = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query(
            `SELECT t.id_cuenta_tesoreria, t.tipo, t.nombre, t.numero_cuenta, t.id_cuenta_contable,
                    c.codigo AS cuenta_codigo, c.nombre AS cuenta_nombre, t.id_sucursal, t.estado,
                    COALESCE((
                        SELECT SUM(CASE WHEN m.tipo IN ('deposito','transferencia_entrada','ajuste') THEN m.monto ELSE -m.monto END)
                        FROM movimiento_tesoreria m WHERE m.id_cuenta_tesoreria = t.id_cuenta_tesoreria
                    ), 0) AS saldo
             FROM cuenta_tesoreria t
             INNER JOIN cuenta_contable c ON t.id_cuenta_contable = c.id_cuenta
             WHERE t.id_tenant = ?
             ORDER BY t.nombre`,
            [req.id_tenant]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getCuentasTesoreria:", error);
        res.status(500).json({ success: false, message: "Error al obtener cuentas de tesorería" });
    } finally {
        if (connection) connection.release();
    }
};

const createCuentaTesoreria = async (req, res) => {
    const { tipo, nombre, numero_cuenta, id_cuenta_contable, id_sucursal } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const [cuenta] = await connection.query(
            "SELECT id_cuenta FROM cuenta_contable WHERE id_cuenta = ? AND id_tenant = ? AND permite_movimiento = 1",
            [id_cuenta_contable, req.id_tenant]
        );
        if (cuenta.length === 0) {
            return res.status(400).json({ success: false, message: "La cuenta contable no existe o no admite movimientos" });
        }
        const [result] = await connection.query(
            "INSERT INTO cuenta_tesoreria (id_tenant, tipo, nombre, numero_cuenta, id_cuenta_contable, id_sucursal) VALUES (?, ?, ?, ?, ?, ?)",
            [req.id_tenant, tipo, nombre, numero_cuenta || null, id_cuenta_contable, id_sucursal || null]
        );
        res.json({ success: true, id_cuenta_tesoreria: result.insertId });
    } catch (error) {
        console.error("Error en createCuentaTesoreria:", error);
        res.status(500).json({ success: false, message: "Error al crear la cuenta de tesorería" });
    } finally {
        if (connection) connection.release();
    }
};

// ─────────────────────────────────────────────────────────────────
// Movimientos (cada uno genera su asiento contable)
// ─────────────────────────────────────────────────────────────────
const getMovimientos = async (req, res) => {
    const { idCuentaTesoreria, fechaInicio, fechaFin } = req.query;
    let connection;
    try {
        connection = await getConnection();
        const where = ["m.id_tenant = ?"];
        const params = [req.id_tenant];
        if (idCuentaTesoreria) { where.push("m.id_cuenta_tesoreria = ?"); params.push(idCuentaTesoreria); }
        if (fechaInicio) { where.push("m.fecha >= ?"); params.push(fechaInicio); }
        if (fechaFin) { where.push("m.fecha <= ?"); params.push(fechaFin); }

        const [rows] = await connection.query(
            `SELECT m.id_movimiento, m.id_cuenta_tesoreria, t.nombre AS cuenta_tesoreria_nombre,
                    m.fecha, m.tipo, m.monto, m.descripcion, m.referencia, m.id_asiento, m.conciliado, m.fecha_conciliacion
             FROM movimiento_tesoreria m
             INNER JOIN cuenta_tesoreria t ON m.id_cuenta_tesoreria = t.id_cuenta_tesoreria
             WHERE ${where.join(" AND ")}
             ORDER BY m.fecha DESC, m.id_movimiento DESC`,
            params
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getMovimientos (tesorería):", error);
        res.status(500).json({ success: false, message: "Error al obtener movimientos de tesorería" });
    } finally {
        if (connection) connection.release();
    }
};

const createMovimiento = async (req, res) => {
    const { id_cuenta_tesoreria, id_cuenta_contra, fecha, tipo, monto, descripcion, referencia } = req.body;
    let connection;
    try {
        connection = await getConnection();

        const [cuentaTes] = await connection.query(
            "SELECT id_cuenta_contable FROM cuenta_tesoreria WHERE id_cuenta_tesoreria = ? AND id_tenant = ? AND estado = 1",
            [id_cuenta_tesoreria, req.id_tenant]
        );
        if (cuentaTes.length === 0) {
            return res.status(400).json({ success: false, message: "La cuenta de tesorería no existe o está inactiva" });
        }
        const [cuentaContra] = await connection.query(
            "SELECT id_cuenta FROM cuenta_contable WHERE id_cuenta = ? AND id_tenant = ? AND permite_movimiento = 1",
            [id_cuenta_contra, req.id_tenant]
        );
        if (cuentaContra.length === 0) {
            return res.status(400).json({ success: false, message: "La cuenta contrapartida no existe o no admite movimientos" });
        }

        const [periodos] = await connection.query(
            "SELECT id_periodo, estado FROM periodo_contable WHERE id_tenant = ? AND ? BETWEEN fecha_inicio AND fecha_fin",
            [req.id_tenant, fecha]
        );
        if (periodos.length === 0 || periodos[0].estado !== "abierto") {
            return res.status(400).json({ success: false, message: "No hay un periodo contable abierto para esa fecha" });
        }
        const id_periodo = periodos[0].id_periodo;
        const idCuentaTesoreriaContable = cuentaTes[0].id_cuenta_contable;
        const esIngreso = INFLOW_TYPES.has(tipo);

        await connection.beginTransaction();

        const [ultimo] = await connection.query(
            "SELECT COALESCE(MAX(numero), 0) AS max FROM asiento_contable WHERE id_tenant = ?",
            [req.id_tenant]
        );
        const numero = ultimo[0].max + 1;

        const [asientoResult] = await connection.query(
            `INSERT INTO asiento_contable
                (id_tenant, numero, fecha, id_periodo, tipo, descripcion, documento_origen, estado, creado_por, contabilizado_por, contabilizado_en)
             VALUES (?, ?, ?, ?, 'automatico', ?, 'tesoreria', 'contabilizado', ?, ?, NOW())`,
            [req.id_tenant, numero, fecha, id_periodo, descripcion || `Movimiento de tesorería (${tipo})`, req.user.id_usuario, req.user.id_usuario]
        );
        const id_asiento = asientoResult.insertId;

        const lineas = esIngreso
            ? [[idCuentaTesoreriaContable, monto, 0], [id_cuenta_contra, 0, monto]]
            : [[id_cuenta_contra, monto, 0], [idCuentaTesoreriaContable, 0, monto]];

        await connection.query(
            "INSERT INTO asiento_detalle (id_asiento, orden, id_cuenta, descripcion, debe, haber) VALUES ?",
            [lineas.map(([id_cuenta, debe, haber], i) => [id_asiento, i, id_cuenta, descripcion || null, debe, haber])]
        );

        const [movResult] = await connection.query(
            `INSERT INTO movimiento_tesoreria
                (id_tenant, id_cuenta_tesoreria, fecha, tipo, monto, descripcion, referencia, id_asiento, creado_por)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.id_tenant, id_cuenta_tesoreria, fecha, tipo, monto, descripcion || null, referencia || null, id_asiento, req.user.id_usuario]
        );

        await connection.commit();
        logAudit(req, {
            actor_user_id: req.user.id_usuario, actor_role: req.user.rol, id_tenant_target: req.id_tenant,
            entity_type: "MOVIMIENTO_TESORERIA", entity_id: String(movResult.insertId), action: "CREATE",
            details: { tipo, monto, id_cuenta_tesoreria, id_asiento },
        });
        res.json({ success: true, id_movimiento: movResult.insertId, id_asiento });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error en createMovimiento (tesorería):", error);
        res.status(500).json({ success: false, message: "Error al registrar el movimiento" });
    } finally {
        if (connection) connection.release();
    }
};

const conciliarMovimiento = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            "UPDATE movimiento_tesoreria SET conciliado = 1, fecha_conciliacion = NOW() WHERE id_movimiento = ? AND id_tenant = ?",
            [id, req.id_tenant]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Movimiento no encontrado" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error en conciliarMovimiento:", error);
        res.status(500).json({ success: false, message: "Error al conciliar el movimiento" });
    } finally {
        if (connection) connection.release();
    }
};

// ─────────────────────────────────────────────────────────────────
// Cierre de caja
// ─────────────────────────────────────────────────────────────────
const cerrarCaja = async (req, res) => {
    const { id_cuenta_tesoreria, fecha, observacion } = req.body;
    if (!id_cuenta_tesoreria || !fecha) {
        return res.status(400).json({ success: false, message: "La cuenta de tesorería y la fecha son obligatorias" });
    }
    let connection;
    try {
        connection = await getConnection();

        const [movimientosDelDia] = await connection.query(
            "SELECT tipo, monto FROM movimiento_tesoreria WHERE id_cuenta_tesoreria = ? AND id_tenant = ? AND fecha = ?",
            [id_cuenta_tesoreria, req.id_tenant, fecha]
        );
        const totalIngresos = movimientosDelDia.filter((m) => INFLOW_TYPES.has(m.tipo)).reduce((s, m) => s + Number(m.monto), 0);
        const totalEgresos = movimientosDelDia.filter((m) => !INFLOW_TYPES.has(m.tipo)).reduce((s, m) => s + Number(m.monto), 0);

        const [saldoPrevioRows] = await connection.query(
            `SELECT COALESCE(SUM(CASE WHEN tipo IN ('deposito','transferencia_entrada','ajuste') THEN monto ELSE -monto END), 0) AS saldo
             FROM movimiento_tesoreria WHERE id_cuenta_tesoreria = ? AND id_tenant = ? AND fecha < ?`,
            [id_cuenta_tesoreria, req.id_tenant, fecha]
        );
        const saldoInicial = Number(saldoPrevioRows[0].saldo);
        const saldoFinal = saldoInicial + totalIngresos - totalEgresos;

        const [result] = await connection.query(
            `INSERT INTO cierre_caja (id_tenant, id_cuenta_tesoreria, fecha, saldo_inicial, total_ingresos, total_egresos, saldo_final, observacion, cerrado_por)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.id_tenant, id_cuenta_tesoreria, fecha, saldoInicial, totalIngresos, totalEgresos, saldoFinal, observacion || null, req.user.id_usuario]
        );
        logAudit(req, {
            actor_user_id: req.user.id_usuario, actor_role: req.user.rol, id_tenant_target: req.id_tenant,
            entity_type: "CIERRE_CAJA", entity_id: String(result.insertId), action: "CREATE",
            details: { id_cuenta_tesoreria, fecha, saldoFinal },
        });
        res.json({ success: true, id_cierre: result.insertId, saldoInicial, totalIngresos, totalEgresos, saldoFinal });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ success: false, message: "Ya existe un cierre de caja para esa cuenta y fecha" });
        }
        console.error("Error en cerrarCaja:", error);
        res.status(500).json({ success: false, message: "Error al cerrar la caja" });
    } finally {
        if (connection) connection.release();
    }
};

const getCierres = async (req, res) => {
    const { idCuentaTesoreria } = req.query;
    let connection;
    try {
        connection = await getConnection();
        const where = ["cc.id_tenant = ?"];
        const params = [req.id_tenant];
        if (idCuentaTesoreria) { where.push("cc.id_cuenta_tesoreria = ?"); params.push(idCuentaTesoreria); }

        const [rows] = await connection.query(
            `SELECT cc.id_cierre, cc.fecha, t.nombre AS cuenta_tesoreria_nombre, cc.saldo_inicial, cc.total_ingresos, cc.total_egresos, cc.saldo_final, cc.observacion, cc.cerrado_en
             FROM cierre_caja cc
             INNER JOIN cuenta_tesoreria t ON cc.id_cuenta_tesoreria = t.id_cuenta_tesoreria
             WHERE ${where.join(" AND ")}
             ORDER BY cc.fecha DESC`,
            params
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getCierres:", error);
        res.status(500).json({ success: false, message: "Error al obtener cierres de caja" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getCuentasTesoreria, createCuentaTesoreria,
    getMovimientos, createMovimiento, conciliarMovimiento,
    cerrarCaja, getCierres,
};
