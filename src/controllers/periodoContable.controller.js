import { getConnection } from "../database/database.js";
import { logAudit } from "../utils/auditLogger.js";

const getPeriodos = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query(
            `SELECT id_periodo, anio, mes, fecha_inicio, fecha_fin, estado, cerrado_por, cerrado_en, motivo_reapertura
             FROM periodo_contable
             WHERE id_tenant = ?
             ORDER BY anio DESC, mes DESC`,
            [req.id_tenant]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getPeriodos:", error);
        res.status(500).json({ success: false, message: "Error al obtener periodos contables" });
    } finally {
        if (connection) connection.release();
    }
};

const crearSiguientePeriodo = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [ultimo] = await connection.query(
            "SELECT anio, mes FROM periodo_contable WHERE id_tenant = ? ORDER BY anio DESC, mes DESC LIMIT 1",
            [req.id_tenant]
        );

        let anio, mes;
        if (ultimo.length === 0) {
            const hoy = new Date();
            anio = hoy.getFullYear();
            mes = hoy.getMonth() + 1;
        } else {
            anio = ultimo[0].anio;
            mes = ultimo[0].mes + 1;
            if (mes > 12) { mes = 1; anio += 1; }
        }

        const fechaInicio = `${anio}-${String(mes).padStart(2, "0")}-01`;
        const fechaFin = new Date(anio, mes, 0).toISOString().slice(0, 10);

        const [result] = await connection.query(
            "INSERT INTO periodo_contable (id_tenant, anio, mes, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?, 'abierto')",
            [req.id_tenant, anio, mes, fechaInicio, fechaFin]
        );
        res.json({ success: true, id_periodo: result.insertId, anio, mes });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ success: false, message: "Ese periodo ya existe" });
        }
        console.error("Error en crearSiguientePeriodo:", error);
        res.status(500).json({ success: false, message: "Error al crear el periodo" });
    } finally {
        if (connection) connection.release();
    }
};

const cerrarPeriodo = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getConnection();
        const [periodo] = await connection.query(
            "SELECT estado FROM periodo_contable WHERE id_periodo = ? AND id_tenant = ?",
            [id, req.id_tenant]
        );
        if (periodo.length === 0) {
            return res.status(404).json({ success: false, message: "Periodo no encontrado" });
        }
        if (periodo[0].estado !== "abierto") {
            return res.status(400).json({ success: false, message: "Solo se pueden cerrar periodos abiertos" });
        }

        await connection.query(
            "UPDATE periodo_contable SET estado = 'cerrado', cerrado_por = ?, cerrado_en = NOW() WHERE id_periodo = ?",
            [req.user.id_usuario, id]
        );
        logAudit(req, {
            actor_user_id: req.user.id_usuario, actor_role: req.user.rol, id_tenant_target: req.id_tenant,
            entity_type: "PERIODO_CONTABLE", entity_id: String(id), action: "CLOSE",
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Error en cerrarPeriodo:", error);
        res.status(500).json({ success: false, message: "Error al cerrar el periodo" });
    } finally {
        if (connection) connection.release();
    }
};

const reabrirPeriodo = async (req, res) => {
    const { id } = req.params;
    const { motivo } = req.body;
    if (!motivo || !motivo.trim()) {
        return res.status(400).json({ success: false, message: "El motivo de reapertura es obligatorio" });
    }
    let connection;
    try {
        connection = await getConnection();
        const [periodo] = await connection.query(
            "SELECT estado FROM periodo_contable WHERE id_periodo = ? AND id_tenant = ?",
            [id, req.id_tenant]
        );
        if (periodo.length === 0) {
            return res.status(404).json({ success: false, message: "Periodo no encontrado" });
        }
        if (periodo[0].estado !== "cerrado") {
            return res.status(400).json({ success: false, message: "Solo se pueden reabrir periodos cerrados" });
        }

        await connection.query(
            "UPDATE periodo_contable SET estado = 'abierto', motivo_reapertura = ? WHERE id_periodo = ?",
            [motivo.trim(), id]
        );
        logAudit(req, {
            actor_user_id: req.user.id_usuario, actor_role: req.user.rol, id_tenant_target: req.id_tenant,
            entity_type: "PERIODO_CONTABLE", entity_id: String(id), action: "REOPEN", details: { motivo: motivo.trim() },
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Error en reabrirPeriodo:", error);
        res.status(500).json({ success: false, message: "Error al reabrir el periodo" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getPeriodos, crearSiguientePeriodo, cerrarPeriodo, reabrirPeriodo };
