import { getConnection } from "../database/database.js";
import { logAudit } from "../utils/auditLogger.js";
import { AuthZService } from "../services/authz.service.js";

// Listar versiones (DRAFT/PUBLISHED/ARCHIVED) de un plan
const listVersions = async (req, res) => {
    let connection;
    try {
        const { id_plan } = req.params;
        connection = await getConnection();

        const [versions] = await connection.query(
            "SELECT * FROM plan_template_version WHERE id_plan = ? ORDER BY version DESC",
            [id_plan]
        );

        res.json({ success: true, data: versions });
    } catch (error) {
        console.error("Error listing versions:", error);
        res.status(500).json({ success: false, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

// Obtener los módulos/submódulos incluidos en una versión (para editar un DRAFT o ver un PUBLISHED)
const getEntitlements = async (req, res) => {
    let connection;
    try {
        const { id } = req.params; // template_version_id
        connection = await getConnection();

        const [modulos] = await connection.query(
            "SELECT id_modulo FROM plan_entitlement_modulo WHERE template_version_id = ?",
            [id]
        );
        const [submodulos] = await connection.query(
            "SELECT id_submodulo FROM plan_entitlement_submodulo WHERE template_version_id = ?",
            [id]
        );

        res.json({
            success: true,
            data: {
                modulos: modulos.map(m => m.id_modulo),
                submodulos: submodulos.map(s => s.id_submodulo)
            }
        });
    } catch (error) {
        console.error("Error getting entitlements:", error);
        res.status(500).json({ success: false, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

// Crear un borrador (DRAFT) de plantilla para un plan
const createDraft = async (req, res) => {
    let connection;
    try {
        const { id_plan, version_base } = req.body; // version_base (opcional): copiar entitlements de una versión existente
        if (!id_plan) return res.status(400).json({ success: false, message: "id_plan es requerido" });

        connection = await getConnection();

        const [existing] = await connection.query(
            "SELECT id FROM plan_template_version WHERE id_plan = ? AND status = 'DRAFT'",
            [id_plan]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Ya existe una versión en borrador para este plan." });
        }

        const [last] = await connection.query(
            "SELECT MAX(version) as max_v FROM plan_template_version WHERE id_plan = ?",
            [id_plan]
        );
        const nextVersion = (last[0].max_v || 0) + 1;

        const [result] = await connection.query(
            "INSERT INTO plan_template_version (id_plan, version, status, created_by) VALUES (?, ?, 'DRAFT', ?)",
            [id_plan, nextVersion, req.user?.id_usuario]
        );
        const newId = result.insertId;

        // Copiar entitlements de una versión base (por defecto, la PUBLISHED actual) para no partir de cero
        let baseVersionId = version_base;
        if (!baseVersionId) {
            const [publishedRows] = await connection.query(
                "SELECT id FROM plan_template_version WHERE id_plan = ? AND status = 'PUBLISHED' ORDER BY version DESC LIMIT 1",
                [id_plan]
            );
            baseVersionId = publishedRows[0]?.id || null;
        }

        if (baseVersionId) {
            await connection.query(
                `INSERT INTO plan_entitlement_modulo (template_version_id, id_modulo)
                 SELECT ?, id_modulo FROM plan_entitlement_modulo WHERE template_version_id = ?`,
                [newId, baseVersionId]
            );
            await connection.query(
                `INSERT INTO plan_entitlement_submodulo (template_version_id, id_submodulo)
                 SELECT ?, id_submodulo FROM plan_entitlement_submodulo WHERE template_version_id = ?`,
                [newId, baseVersionId]
            );
        }

        logAudit(req, {
            actor_user_id: req.user?.id_usuario,
            actor_role: req.user?.rol,
            id_tenant_target: null,
            entity_type: 'PLAN_TEMPLATE',
            entity_id: String(newId),
            action: 'CREATE_DRAFT',
            details: { id_plan, version: nextVersion, copiado_de: baseVersionId || null }
        });

        res.json({ success: true, message: "Borrador creado", id: newId, version: nextVersion });
    } catch (error) {
        console.error("Error creating draft:", error);
        res.status(500).json({ success: false, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

// Reemplazar el set de módulos/submódulos incluidos en un DRAFT (delete + insert, mismo patrón que savePermisos)
const saveEntitlements = async (req, res) => {
    let connection;
    try {
        const { id } = req.params; // template_version_id
        const { modulos = [], submodulos = [] } = req.body;

        connection = await getConnection();

        const [rows] = await connection.query("SELECT * FROM plan_template_version WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Versión no encontrada" });
        if (rows[0].status !== 'DRAFT') {
            return res.status(400).json({ success: false, message: "Solo se pueden editar entitlements de un borrador (DRAFT)" });
        }

        await connection.beginTransaction();

        await connection.query("DELETE FROM plan_entitlement_modulo WHERE template_version_id = ?", [id]);
        await connection.query("DELETE FROM plan_entitlement_submodulo WHERE template_version_id = ?", [id]);

        if (modulos.length > 0) {
            const placeholders = modulos.map(() => '(?, ?)').join(', ');
            const params = modulos.flatMap(idModulo => [id, idModulo]);
            await connection.query(
                `INSERT INTO plan_entitlement_modulo (template_version_id, id_modulo) VALUES ${placeholders}`,
                params
            );
        }
        if (submodulos.length > 0) {
            const placeholders = submodulos.map(() => '(?, ?)').join(', ');
            const params = submodulos.flatMap(idSubmodulo => [id, idSubmodulo]);
            await connection.query(
                `INSERT INTO plan_entitlement_submodulo (template_version_id, id_submodulo) VALUES ${placeholders}`,
                params
            );
        }

        await connection.commit();

        // Cambiaron los entitlements del DRAFT → invalidar catálogo cacheado
        // (afecta a cualquier tenant que vaya a leerlo). ponytail: clear global.
        AuthZService.clearCache();

        logAudit(req, {
            actor_user_id: req.user?.id_usuario,
            actor_role: req.user?.rol,
            id_tenant_target: null,
            entity_type: 'PLAN_TEMPLATE',
            entity_id: String(id),
            action: 'UPDATE_ENTITLEMENTS',
            details: { id_plan: rows[0].id_plan, modulos: modulos.length, submodulos: submodulos.length }
        });

        res.json({ success: true, message: "Entitlements actualizados" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error saving entitlements:", error);
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

        const [rows] = await connection.query("SELECT * FROM plan_template_version WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Versión no encontrada" });
        if (rows[0].status !== 'DRAFT') return res.status(400).json({ success: false, message: "Solo se pueden publicar borradores" });

        await connection.query(
            "UPDATE plan_template_version SET status = 'ARCHIVED' WHERE id_plan = ? AND status = 'PUBLISHED'",
            [rows[0].id_plan]
        );

        await connection.query(
            "UPDATE plan_template_version SET status = 'PUBLISHED', published_at = NOW() WHERE id = ?",
            [id]
        );

        // Fase 1: los entitlements del plan cambiaron → subir perm_version de
        // todos los tenants en ese plan para invalidar sus cachés versionadas.
        await connection.query(
            `UPDATE empresa e SET e.perm_version = e.perm_version + 1
             WHERE e.id_tenant IN (
                SELECT DISTINCT u.id_tenant FROM usuario u
                WHERE u.plan_pago = ? AND u.id_rol = 1 AND u.id_tenant IS NOT NULL
             )`,
            [rows[0].id_plan]
        );

        // Una nueva versión PUBLISHED entra en vigor → todos los tenants en este
        // `id_plan` ahora ven los nuevos entitlements en su catálogo.
        AuthZService.clearCache();

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

// Descartar un borrador sin publicar
const discardDraft = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();

        const [rows] = await connection.query("SELECT * FROM plan_template_version WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Versión no encontrada" });
        if (rows[0].status !== 'DRAFT') {
            return res.status(400).json({ success: false, message: "Solo se pueden descartar borradores" });
        }

        await connection.query("DELETE FROM plan_template_version WHERE id = ?", [id]);

        logAudit(req, {
            actor_user_id: req.user?.id_usuario,
            actor_role: req.user?.rol,
            id_tenant_target: null,
            entity_type: 'PLAN_TEMPLATE',
            entity_id: String(id),
            action: 'DISCARD_DRAFT',
            details: { id_plan: rows[0].id_plan, version: rows[0].version }
        });

        res.json({ success: true, message: "Borrador descartado" });
    } catch (error) {
        console.error("Error discarding draft:", error);
        res.status(500).json({ success: false, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    listVersions,
    getEntitlements,
    createDraft,
    saveEntitlements,
    publishVersion,
    discardDraft
};
