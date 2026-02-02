import { getConnection } from "../database/database.js";
import { logAudit } from "../utils/auditLogger.js";

// Helper for user info
function getUserName(req) {
    return req.user?.nameUser || req.user?.usr || req.user?.usuario || req.user?.username || req.nameUser;
}

const getUnidades = async (req, res) => {
    try {
        const connection = await getConnection();
        const id_tenant = req.id_tenant;

        // Fetch defaults (System) and Tenant specific
        const [result] = await connection.query(`
      SELECT * FROM unidades 
      WHERE (id_tenant IS NULL OR id_tenant = ?)
      ORDER BY descripcion ASC
    `, [id_tenant]);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const addUnidad = async (req, res) => {
    try {
        const { codigo_sunat, descripcion } = req.body;
        const connection = await getConnection();
        const id_tenant = req.id_tenant;

        if (!codigo_sunat || !descripcion) {
            return res.status(400).json({ success: false, message: "Datos incompletos" });
        }

        const [result] = await connection.query(`
      INSERT INTO unidades (codigo_sunat, descripcion, id_tenant, estado)
      VALUES (?, ?, ?, 1)
    `, [codigo_sunat, descripcion, id_tenant]);

        // Audit
        logAudit(req, {
            actor_user_id: req.user?.id_usuario,
            action: 'CREATE',
            entity_type: 'UNIDADES',
            entity_id: result.insertId.toString(),
            details: { codigo_sunat, descripcion, id_tenant }
        });

        res.json({ success: true, message: "Unidad creada" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateUnidad = async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo_sunat, descripcion, estado } = req.body;
        const connection = await getConnection();
        const id_tenant = req.id_tenant;

        // Check ownership
        const [check] = await connection.query("SELECT * FROM unidades WHERE id_unidad = ? AND id_tenant = ?", [id, id_tenant]);
        if (check.length === 0) {
            return res.status(403).json({ success: false, message: "No puedes editar esta unidad (Sistema o diferente tenant)" });
        }

        await connection.query(`
      UPDATE unidades SET codigo_sunat = ?, descripcion = ?, estado = ?
      WHERE id_unidad = ?
    `, [codigo_sunat, descripcion, estado, id]);

        // Audit
        logAudit(req, {
            actor_user_id: req.user?.id_usuario,
            action: 'UPDATE',
            entity_type: 'UNIDADES',
            entity_id: id,
            details: { codigo_sunat, descripcion, estado }
        });

        res.json({ success: true, message: "Unidad actualizada" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteUnidad = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const id_tenant = req.id_tenant;

        // Check ownership
        const [check] = await connection.query("SELECT * FROM unidades WHERE id_unidad = ? AND id_tenant = ?", [id, id_tenant]);
        if (check.length === 0) {
            return res.status(403).json({ success: false, message: "No puedes eliminar esta unidad (Sistema o diferente tenant)" });
        }

        await connection.query("DELETE FROM unidades WHERE id_unidad = ?", [id]);

        // Audit
        logAudit(req, {
            actor_user_id: req.user?.id_usuario,
            action: 'DELETE',
            entity_type: 'UNIDADES',
            entity_id: id,
            details: { id_tenant }
        });

        res.json({ success: true, message: "Unidad eliminada" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const methods = {
    getUnidades,
    addUnidad,
    updateUnidad,
    deleteUnidad
};
