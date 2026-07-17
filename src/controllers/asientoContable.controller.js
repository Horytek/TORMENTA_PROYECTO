import { getConnection } from "../database/database.js";
import { logAudit } from "../utils/auditLogger.js";

const getAsientos = async (req, res) => {
    const { fechaInicio, fechaFin, idPeriodo, estado } = req.query;
    let connection;
    try {
        connection = await getConnection();
        const where = ["a.id_tenant = ?"];
        const params = [req.id_tenant];
        if (fechaInicio) { where.push("a.fecha >= ?"); params.push(fechaInicio); }
        if (fechaFin) { where.push("a.fecha <= ?"); params.push(fechaFin); }
        if (idPeriodo) { where.push("a.id_periodo = ?"); params.push(idPeriodo); }
        if (estado) { where.push("a.estado = ?"); params.push(estado); }

        const [rows] = await connection.query(
            `SELECT a.id_asiento, a.numero, a.fecha, a.tipo, a.descripcion, a.documento_origen, a.estado,
                    a.id_asiento_reversa, a.id_periodo,
                    (SELECT COALESCE(SUM(d.debe), 0) FROM asiento_detalle d WHERE d.id_asiento = a.id_asiento) AS total
             FROM asiento_contable a
             WHERE ${where.join(" AND ")}
             ORDER BY a.fecha DESC, a.numero DESC`,
            params
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getAsientos:", error);
        res.status(500).json({ success: false, message: "Error al obtener asientos contables" });
    } finally {
        if (connection) connection.release();
    }
};

const getAsiento = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getConnection();
        const [cabecera] = await connection.query(
            "SELECT * FROM asiento_contable WHERE id_asiento = ? AND id_tenant = ?",
            [id, req.id_tenant]
        );
        if (cabecera.length === 0) {
            return res.status(404).json({ success: false, message: "Asiento no encontrado" });
        }
        const [lineas] = await connection.query(
            `SELECT d.id_detalle, d.orden, d.id_cuenta, c.codigo AS cuenta_codigo, c.nombre AS cuenta_nombre,
                    d.id_centro_costo, cc.nombre AS centro_costo_nombre, d.id_cliente, d.descripcion, d.debe, d.haber
             FROM asiento_detalle d
             INNER JOIN cuenta_contable c ON d.id_cuenta = c.id_cuenta
             LEFT JOIN centro_costo cc ON d.id_centro_costo = cc.id_centro_costo
             WHERE d.id_asiento = ?
             ORDER BY d.orden`,
            [id]
        );
        res.json({ success: true, data: { ...cabecera[0], lineas } });
    } catch (error) {
        console.error("Error en getAsiento:", error);
        res.status(500).json({ success: false, message: "Error al obtener el asiento" });
    } finally {
        if (connection) connection.release();
    }
};

const createAsiento = async (req, res) => {
    const { fecha, tipo, descripcion, documento_origen, lineas } = req.body;
    let connection;
    try {
        connection = await getConnection();

        const [periodos] = await connection.query(
            "SELECT id_periodo, estado FROM periodo_contable WHERE id_tenant = ? AND ? BETWEEN fecha_inicio AND fecha_fin",
            [req.id_tenant, fecha]
        );
        if (periodos.length === 0) {
            return res.status(400).json({ success: false, message: "No existe un periodo contable para esa fecha" });
        }
        if (periodos[0].estado !== "abierto") {
            return res.status(400).json({ success: false, message: "El periodo contable de esa fecha está cerrado" });
        }
        const id_periodo = periodos[0].id_periodo;

        const idsCuenta = [...new Set(lineas.map((l) => l.id_cuenta))];
        const [cuentas] = await connection.query(
            `SELECT id_cuenta, estado, permite_movimiento FROM cuenta_contable WHERE id_tenant = ? AND id_cuenta IN (?)`,
            [req.id_tenant, idsCuenta]
        );
        if (cuentas.length !== idsCuenta.length) {
            return res.status(400).json({ success: false, message: "Alguna cuenta del asiento no existe" });
        }
        const cuentaInvalida = cuentas.find((c) => c.estado !== 1 || c.permite_movimiento !== 1);
        if (cuentaInvalida) {
            return res.status(400).json({ success: false, message: "Alguna cuenta del asiento está inactiva o no permite movimientos directos (es una cuenta resumen)" });
        }

        const idsCentroCosto = [...new Set(lineas.map((l) => l.id_centro_costo).filter(Boolean))];
        if (idsCentroCosto.length > 0) {
            const [centros] = await connection.query(
                "SELECT id_centro_costo FROM centro_costo WHERE id_tenant = ? AND id_centro_costo IN (?)",
                [req.id_tenant, idsCentroCosto]
            );
            if (centros.length !== idsCentroCosto.length) {
                return res.status(400).json({ success: false, message: "Algún centro de costo del asiento no existe" });
            }
        }

        await connection.beginTransaction();

        const [ultimo] = await connection.query(
            "SELECT COALESCE(MAX(numero), 0) AS max FROM asiento_contable WHERE id_tenant = ?",
            [req.id_tenant]
        );
        const numero = ultimo[0].max + 1;

        const [result] = await connection.query(
            `INSERT INTO asiento_contable
                (id_tenant, numero, fecha, id_periodo, tipo, descripcion, documento_origen, estado, creado_por, contabilizado_por, contabilizado_en)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'contabilizado', ?, ?, NOW())`,
            [req.id_tenant, numero, fecha, id_periodo, tipo || "manual", descripcion, documento_origen || null, req.user.id_usuario, req.user.id_usuario]
        );
        const id_asiento = result.insertId;

        const values = lineas.map((l, i) => [
            id_asiento, i, l.id_cuenta, l.id_centro_costo || null, l.id_cliente || null,
            l.descripcion || null, l.debe || 0, l.haber || 0,
        ]);
        await connection.query(
            "INSERT INTO asiento_detalle (id_asiento, orden, id_cuenta, id_centro_costo, id_cliente, descripcion, debe, haber) VALUES ?",
            [values]
        );

        await connection.commit();
        logAudit(req, {
            actor_user_id: req.user.id_usuario, actor_role: req.user.rol, id_tenant_target: req.id_tenant,
            entity_type: "ASIENTO_CONTABLE", entity_id: String(id_asiento), action: "CREATE",
            details: { numero, fecha, tipo, totalLineas: lineas.length },
        });
        res.json({ success: true, id_asiento, numero });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error en createAsiento:", error);
        res.status(500).json({ success: false, message: "Error al contabilizar el asiento" });
    } finally {
        if (connection) connection.release();
    }
};

const revertirAsiento = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getConnection();

        const [original] = await connection.query(
            "SELECT * FROM asiento_contable WHERE id_asiento = ? AND id_tenant = ?",
            [id, req.id_tenant]
        );
        if (original.length === 0) {
            return res.status(404).json({ success: false, message: "Asiento no encontrado" });
        }
        if (original[0].estado !== "contabilizado") {
            return res.status(400).json({ success: false, message: "Solo se pueden revertir asientos contabilizados" });
        }

        const hoy = new Date().toISOString().slice(0, 10);
        const [periodos] = await connection.query(
            "SELECT id_periodo FROM periodo_contable WHERE id_tenant = ? AND ? BETWEEN fecha_inicio AND fecha_fin AND estado = 'abierto'",
            [req.id_tenant, hoy]
        );
        if (periodos.length === 0) {
            return res.status(400).json({ success: false, message: "No hay un periodo contable abierto para registrar la reversión" });
        }
        const id_periodo = periodos[0].id_periodo;

        const [lineas] = await connection.query(
            "SELECT id_cuenta, id_centro_costo, id_cliente, descripcion, debe, haber FROM asiento_detalle WHERE id_asiento = ? ORDER BY orden",
            [id]
        );

        await connection.beginTransaction();

        const [ultimo] = await connection.query(
            "SELECT COALESCE(MAX(numero), 0) AS max FROM asiento_contable WHERE id_tenant = ?",
            [req.id_tenant]
        );
        const numero = ultimo[0].max + 1;

        const [result] = await connection.query(
            `INSERT INTO asiento_contable
                (id_tenant, numero, fecha, id_periodo, tipo, descripcion, documento_origen, estado, creado_por, contabilizado_por, contabilizado_en)
             VALUES (?, ?, ?, ?, 'reversion', ?, ?, 'contabilizado', ?, ?, NOW())`,
            [
                req.id_tenant, numero, hoy, id_periodo,
                `Reversión del asiento #${original[0].numero}`, `asiento:${id}`,
                req.user.id_usuario, req.user.id_usuario,
            ]
        );
        const id_reversa = result.insertId;

        const values = lineas.map((l, i) => [
            id_reversa, i, l.id_cuenta, l.id_centro_costo, l.id_cliente, l.descripcion,
            l.haber, l.debe, // swap: lo que era Haber pasa a Debe y viceversa
        ]);
        await connection.query(
            "INSERT INTO asiento_detalle (id_asiento, orden, id_cuenta, id_centro_costo, id_cliente, descripcion, debe, haber) VALUES ?",
            [values]
        );

        await connection.query(
            "UPDATE asiento_contable SET estado = 'revertido', id_asiento_reversa = ? WHERE id_asiento = ?",
            [id_reversa, id]
        );

        await connection.commit();
        logAudit(req, {
            actor_user_id: req.user.id_usuario, actor_role: req.user.rol, id_tenant_target: req.id_tenant,
            entity_type: "ASIENTO_CONTABLE", entity_id: String(id), action: "REVERSE",
            details: { id_asiento_reversa: id_reversa, numero },
        });
        res.json({ success: true, id_asiento_reversa: id_reversa, numero });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error en revertirAsiento:", error);
        res.status(500).json({ success: false, message: "Error al revertir el asiento" });
    } finally {
        if (connection) connection.release();
    }
};

const getLibroDiario = async (req, res) => {
    const { fechaInicio, fechaFin, idPeriodo } = req.query;
    let connection;
    try {
        connection = await getConnection();
        const where = ["a.id_tenant = ?", "a.estado != 'anulado'"];
        const params = [req.id_tenant];
        if (fechaInicio) { where.push("a.fecha >= ?"); params.push(fechaInicio); }
        if (fechaFin) { where.push("a.fecha <= ?"); params.push(fechaFin); }
        if (idPeriodo) { where.push("a.id_periodo = ?"); params.push(idPeriodo); }

        const [rows] = await connection.query(
            `SELECT a.id_asiento, a.numero, a.fecha, a.descripcion AS asiento_descripcion, a.tipo,
                    c.codigo AS cuenta_codigo, c.nombre AS cuenta_nombre,
                    d.descripcion, d.debe, d.haber
             FROM asiento_detalle d
             INNER JOIN asiento_contable a ON d.id_asiento = a.id_asiento
             INNER JOIN cuenta_contable c ON d.id_cuenta = c.id_cuenta
             WHERE ${where.join(" AND ")}
             ORDER BY a.fecha, a.numero, d.orden`,
            params
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getLibroDiario:", error);
        res.status(500).json({ success: false, message: "Error al obtener el libro diario" });
    } finally {
        if (connection) connection.release();
    }
};

const getLibroMayor = async (req, res) => {
    const { idCuenta, fechaInicio, fechaFin } = req.query;
    if (!idCuenta) {
        return res.status(400).json({ success: false, message: "La cuenta es obligatoria" });
    }
    let connection;
    try {
        connection = await getConnection();

        const [cuentaRows] = await connection.query(
            "SELECT codigo, nombre, naturaleza FROM cuenta_contable WHERE id_cuenta = ? AND id_tenant = ?",
            [idCuenta, req.id_tenant]
        );
        if (cuentaRows.length === 0) {
            return res.status(404).json({ success: false, message: "Cuenta no encontrada" });
        }
        const cuenta = cuentaRows[0];

        const where = ["a.id_tenant = ?", "a.estado != 'anulado'", "d.id_cuenta = ?"];
        const params = [req.id_tenant, idCuenta];
        if (fechaInicio) { where.push("a.fecha >= ?"); params.push(fechaInicio); }
        if (fechaFin) { where.push("a.fecha <= ?"); params.push(fechaFin); }

        const [movimientos] = await connection.query(
            `SELECT a.id_asiento, a.numero, a.fecha, a.descripcion AS asiento_descripcion,
                    d.descripcion, d.debe, d.haber
             FROM asiento_detalle d
             INNER JOIN asiento_contable a ON d.id_asiento = a.id_asiento
             WHERE ${where.join(" AND ")}
             ORDER BY a.fecha, a.numero`,
            params
        );

        // Naturaleza deudora: el saldo crece con el Debe. Acreedora: crece con el Haber.
        let saldo = 0;
        const detalle = movimientos.map((m) => {
            const signo = cuenta.naturaleza === "deudora" ? 1 : -1;
            saldo += signo * (Number(m.debe) - Number(m.haber));
            return { ...m, saldo };
        });

        res.json({ success: true, data: { cuenta, movimientos: detalle, saldoFinal: saldo } });
    } catch (error) {
        console.error("Error en getLibroMayor:", error);
        res.status(500).json({ success: false, message: "Error al obtener el libro mayor" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getAsientos, getAsiento, createAsiento, revertirAsiento, getLibroDiario, getLibroMayor };
