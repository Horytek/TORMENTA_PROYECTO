import { getConnection } from "../database/database.js";

// Helper para obtener IP
const getIp = (req) => req?.ip || req?.connection?.remoteAddress || '';

/**
 * Registra una acción en el log de auditoría
 * @param {Object} req - Objeto Request de Express (opcional, para sacar IP/User Agent)
 * @param {Object} params - Parámetros del evento
 * @param {number} params.actor_user_id - ID del usuario que realiza la acción
 * @param {string} params.actor_role - ID o Nombre del rol del actor
 * @param {number} params.id_tenant_target - ID del tenant afectado
 * @param {string} params.entity_type - Tipo de entidad ('PERMISOS', 'PLAN', 'USUARIO')
 * @param {string} params.entity_id - ID de la entidad afectada (opcional)
 * @param {string} params.action - Acción realizada ('CREATE', 'UPDATE', 'DELETE')
 * @param {Object} params.details - Detalles adicionales en JSON
 */
export const logAudit = async (req, { actor_user_id, actor_role, id_tenant_target, entity_type, entity_id, action, details }) => {
    // Ejecutar en background para no bloquear el request principal

    setImmediate(async () => {
        let connection;
        try {
            connection = await getConnection();

            const ip = req ? getIp(req) : 'SYSTEM';
            const user_agent = req ? req.get('User-Agent') : 'SYSTEM';
            const metadataJson = details ? JSON.stringify(details) : null;

            // org_id comes from request's id_tenant (required field in audit_log)
            const org_id = req?.id_tenant || id_tenant_target || 1;

            // Column names mapped to actual table structure:
            // entity_type -> target_type
            // entity_id -> target_id  
            // details -> metadata_json
            // ip_address -> ip
            await connection.query(
                `INSERT INTO audit_log 
                (org_id, actor_user_id, actor_role, id_tenant_target, target_type, target_id, action, metadata_json, ip, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    org_id,
                    actor_user_id || null,
                    actor_role || null,
                    id_tenant_target || null,
                    entity_type,
                    entity_id || null,
                    action,
                    metadataJson,
                    ip,
                    user_agent
                ]
            );
        } catch (error) {
            console.error("❌ Error escribiendo audit log:", error);
            // No hacemos throw para no tumbar el proceso, pero logueamos el error
        } finally {
            if (connection) connection.release();
        }
    });
};
