import { getConnection } from "../database/database.js";

const getPresupuestos = async (req, res) => {
    const { anio } = req.query;
    let connection;
    try {
        connection = await getConnection();
        const where = ["p.id_tenant = ?"];
        const params = [req.id_tenant];
        if (anio) { where.push("p.anio = ?"); params.push(anio); }

        const [presupuestos] = await connection.query(
            `SELECT p.id_presupuesto, p.id_cuenta, c.codigo AS cuenta_codigo, c.nombre AS cuenta_nombre, c.naturaleza,
                    p.id_centro_costo, cc.nombre AS centro_costo_nombre, p.anio, p.mes, p.monto_presupuestado
             FROM presupuesto p
             INNER JOIN cuenta_contable c ON p.id_cuenta = c.id_cuenta
             LEFT JOIN centro_costo cc ON p.id_centro_costo = cc.id_centro_costo
             WHERE ${where.join(" AND ")}
             ORDER BY c.codigo, p.mes`,
            params
        );

        // Ejecutado = movimientos reales del periodo cubierto por cada presupuesto, siempre derivado (no se guarda).
        const conEjecutado = await Promise.all(presupuestos.map(async (p) => {
            const fechaInicio = p.mes ? `${p.anio}-${String(p.mes).padStart(2, "0")}-01` : `${p.anio}-01-01`;
            const fechaFin = p.mes
                ? new Date(p.anio, p.mes, 0).toISOString().slice(0, 10)
                : `${p.anio}-12-31`;

            const where2 = ["a.id_tenant = ?", "a.estado != 'anulado'", "d.id_cuenta = ?", "a.fecha BETWEEN ? AND ?"];
            const params2 = [req.id_tenant, p.id_cuenta, fechaInicio, fechaFin];
            if (p.id_centro_costo) { where2.push("d.id_centro_costo = ?"); params2.push(p.id_centro_costo); }

            const [ejecRows] = await connection.query(
                `SELECT COALESCE(SUM(d.debe), 0) AS totalDebe, COALESCE(SUM(d.haber), 0) AS totalHaber
                 FROM asiento_detalle d
                 INNER JOIN asiento_contable a ON d.id_asiento = a.id_asiento
                 WHERE ${where2.join(" AND ")}`,
                params2
            );
            const signo = p.naturaleza === "deudora" ? 1 : -1;
            const ejecutado = signo * (Number(ejecRows[0].totalDebe) - Number(ejecRows[0].totalHaber));

            return {
                ...p,
                ejecutado,
                disponible: Number(p.monto_presupuestado) - ejecutado,
                porcentaje: Number(p.monto_presupuestado) > 0 ? Math.round((ejecutado / Number(p.monto_presupuestado)) * 100) : 0,
            };
        }));

        res.json({ success: true, data: conEjecutado });
    } catch (error) {
        console.error("Error en getPresupuestos:", error);
        res.status(500).json({ success: false, message: "Error al obtener presupuestos" });
    } finally {
        if (connection) connection.release();
    }
};

const upsertPresupuesto = async (req, res) => {
    const { id_cuenta, id_centro_costo, anio, mes, monto_presupuestado } = req.body;
    let connection;
    try {
        connection = await getConnection();
        await connection.query(
            `INSERT INTO presupuesto (id_tenant, id_cuenta, id_centro_costo, anio, mes, monto_presupuestado)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE monto_presupuestado = VALUES(monto_presupuestado)`,
            [req.id_tenant, id_cuenta, id_centro_costo || null, anio, mes || null, monto_presupuestado]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Error en upsertPresupuesto:", error);
        res.status(500).json({ success: false, message: "Error al guardar el presupuesto" });
    } finally {
        if (connection) connection.release();
    }
};

const deletePresupuesto = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getConnection();
        await connection.query("DELETE FROM presupuesto WHERE id_presupuesto = ? AND id_tenant = ?", [id, req.id_tenant]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error en deletePresupuesto:", error);
        res.status(500).json({ success: false, message: "Error al eliminar el presupuesto" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getPresupuestos, upsertPresupuesto, deletePresupuesto };
