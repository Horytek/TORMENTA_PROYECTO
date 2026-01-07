import { getConnection } from "../database/database.js";
import { logAudit } from "../utils/auditLogger.js";

// Crear un borrador (DRAFT) de plantilla para un plan
const createDraft = async (req, res) => {
    let connection;
    try {
        const { id_plan, version_base } = req.body; // version_base (opcional): copiar de una versión existente
        // Validar id_plan
        if (!id_plan) return res.status(400).json({ success: false, message: "id_plan es requerido" });

        connection = await getConnection();

        // Verificar si ya existe un DRAFT
        const [existing] = await connection.query(
            "SELECT id FROM plan_template_version WHERE id_plan = ? AND status = 'DRAFT'",
            [id_plan]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Ya existe una versión en borrador para este plan." });
        }

        // Obtener última versión para incrementar
        const [last] = await connection.query(
            "SELECT MAX(version) as max_v FROM plan_template_version WHERE id_plan = ?",
            [id_plan]
        );
        const nextVersion = (last[0].max_v || 0) + 1;

        // Crear DRAFT
        const [result] = await connection.query(
            "INSERT INTO plan_template_version (id_plan, version, status, created_by) VALUES (?, ?, 'DRAFT', ?)",
            [id_plan, nextVersion, req.user?.id_usuario]
        );
        const newId = result.insertId;

        // Copiar entitlements si se solicita
        if (version_base) {
            // Logic to copy from version_base... (Implementar si es requerido)
        }

        logAudit(req, {
            actor_user_id: req.user?.id_usuario,
            actor_role: req.user?.rol,
            id_tenant_target: null,
            entity_type: 'PLAN_TEMPLATE',
            entity_id: String(newId),
            action: 'CREATE_DRAFT',
            details: { id_plan, version: nextVersion }
        });

        res.json({ success: true, message: "Borrador creado", id: newId, version: nextVersion });
    } catch (error) {
        console.error("Error creating draft:", error);
        res.status(500).json({ success: false, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

// Publicar una versión
const publishVersion = async (req, res) => {
    let connection;
    try {
        const { id } = req.params; // template_version_id
        connection = await getConnection();

        // Verificar estado actual
        const [rows] = await connection.query("SELECT * FROM plan_template_version WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Versión no encontrada" });
        if (rows[0].status !== 'DRAFT') return res.status(400).json({ success: false, message: "Solo se pueden publicar borradores" });

        // Marcar anteriores como ARCHIVED (Opcional, o dejarlas PUBLISHED si permitimos rollbacks, pero usualmente solo hay 1 activa)
        // Asumiremos que pueden haber múltiples published históricas, pero la "Current" es la de mayor versión.
        // O podemos marcar la anterior como ARCHIVED para limpieza.
        // Vamos a marcar todas las anteriores PUBLISHED como ARCHIVED para mantener solo 1 activa oficial
        await connection.query(
            "UPDATE plan_template_version SET status = 'ARCHIVED' WHERE id_plan = ? AND status = 'PUBLISHED'",
            [rows[0].id_plan]
        );

        // Publicar la nueva
        await connection.query(
            "UPDATE plan_template_version SET status = 'PUBLISHED', published_at = NOW() WHERE id = ?",
            [id]
        );

        logAudit(req, {
            actor_user_id: req.user?.id_usuario,
            actor_role: req.user?.rol,
            id_tenant_target: null,
            entity_type: 'PLAN_TEMPLATE',
            entity_id: String(id),
            action: 'PUBLISH',
            details: { id_plan: rows[0].id_plan, version: rows[0].version }
        });

        res.json({ success: true, message: "Versión publicada exitosamente" });
    } catch (error) {
        console.error("Error publishing version:", error);
        res.status(500).json({ success: false, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    createDraft,
    publishVersion
};
