import { getConnection } from "../database/database.js";

const ENTIDADES_CONTABLES = [
    "CUENTA_CONTABLE", "ASIENTO_CONTABLE", "PERIODO_CONTABLE", "CENTRO_COSTO",
    "MOVIMIENTO_TESORERIA", "CIERRE_CAJA", "PRESUPUESTO", "CONTABILIDAD_CONFIG",
];

const getAuditoria = async (req, res) => {
    const { entityType, action, limit } = req.query;
    let connection;
    try {
        connection = await getConnection();
        const where = ["org_id = ?", "target_type IN (?)"];
        const params = [req.id_tenant, entityType ? [entityType] : ENTIDADES_CONTABLES];
        if (action) { where.push("action = ?"); params.push(action); }

        // SELECT * porque el esquema exacto de audit_log (columna de fecha, etc.) vive fuera
        // de este repo (tabla compartida por todo el sistema de auditoría, no solo contabilidad).
        const [rows] = await connection.query(
            `SELECT *
             FROM audit_log
             WHERE ${where.join(" AND ")}
             ORDER BY id DESC
             LIMIT ?`,
            [...params, Math.min(Number(limit) || 100, 500)]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getAuditoria (contable):", error);
        res.status(500).json({ success: false, message: "Error al obtener la auditoría contable" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getAuditoria };
