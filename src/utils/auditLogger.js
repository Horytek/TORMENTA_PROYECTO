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
    // (A menos que la auditoría sea estricta y bloqueante, aquí asumimos background por performance)

    setImmediate(async () => {
        let connection;
        try {
            connection = await getConnection();

            const ip_address = req ? getIp(req) : 'SYSTEM';
            const user_agent = req ? req.get('User-Agent') : 'SYSTEM';
            const detailsJson = details ? JSON.stringify(details) : null;

            await connection.query(
                `INSERT INTO audit_log 
                (actor_user_id, actor_role, id_tenant_target, entity_type, entity_id, action, details, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    actor_user_id || null,
                    actor_role || null,
                    id_tenant_target || null,
                    entity_type,
                    entity_id || null,
                    action,
                    detailsJson,
                    ip_address,
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
