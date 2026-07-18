import { getConnection } from "../database/database.js";

const getConfig = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query(
            `SELECT cfg.id_config, cfg.concepto, cfg.descripcion, cfg.id_cuenta, c.codigo AS cuenta_codigo, c.nombre AS cuenta_nombre
             FROM contabilidad_config cfg
             INNER JOIN cuenta_contable c ON cfg.id_cuenta = c.id_cuenta
             WHERE cfg.id_tenant = ?
             ORDER BY cfg.concepto`,
            [req.id_tenant]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error en getConfig (contabilidad):", error);
        res.status(500).json({ success: false, message: "Error al obtener la configuración contable" });
    } finally {
        if (connection) connection.release();
    }
};

const upsertConfig = async (req, res) => {
    const { concepto, descripcion, id_cuenta } = req.body;
    let connection;
    try {
        connection = await getConnection();

        const [cuenta] = await connection.query(
            "SELECT id_cuenta FROM cuenta_contable WHERE id_cuenta = ? AND id_tenant = ? AND permite_movimiento = 1",
            [id_cuenta, req.id_tenant]
        );
        if (cuenta.length === 0) {
            return res.status(400).json({ success: false, message: "La cuenta no existe o es una cuenta resumen (no admite movimientos)" });
        }

        await connection.query(
            `INSERT INTO contabilidad_config (id_tenant, concepto, descripcion, id_cuenta)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion), id_cuenta = VALUES(id_cuenta)`,
            [req.id_tenant, concepto.trim(), descripcion || null, id_cuenta]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Error en upsertConfig (contabilidad):", error);
        res.status(500).json({ success: false, message: "Error al guardar la configuración" });
    } finally {
        if (connection) connection.release();
    }
};

const deleteConfig = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getConnection();
        await connection.query("DELETE FROM contabilidad_config WHERE id_config = ? AND id_tenant = ?", [id, req.id_tenant]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error en deleteConfig (contabilidad):", error);
        res.status(500).json({ success: false, message: "Error al eliminar la configuración" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getConfig, upsertConfig, deleteConfig };
