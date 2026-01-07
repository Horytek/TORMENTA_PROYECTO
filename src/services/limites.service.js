
import { getConnection } from "../database/database.js";

// Check if a tenant has access to a feature or has reached a limit
export const checkLimit = async (tenantId, featureCode, context = {}) => {
    let connection;
    try {
        connection = await getConnection();

        // 1. Get the plan of the tenant owner (Role 1)
        const [users] = await connection.query(
            "SELECT plan_pago FROM usuario WHERE id_tenant = ? AND id_rol = 1 LIMIT 1",
            [tenantId]
        );

        if (users.length === 0) {
            // No owner found? Should not happen. Allow default? Or block?
            // Safest is to block restricted features if no plan found.
            return { allowed: false, reason: "No plan found for tenant" };
        }

        const planId = users[0].plan_pago;
        if (!planId) return { allowed: false, reason: "No plan assigned" };

        // 2. Get the feature value for this plan
        const [features] = await connection.query(`
            SELECT pf.valor, f.tipo_valor 
            FROM plan_funciones pf
            JOIN funciones f ON pf.id_funcion = f.id_funciones
            WHERE pf.id_plan = ? AND f.codigo = ?
        `, [planId, featureCode]);

        if (features.length === 0) {
            // Feature not in plan -> Default is blocked (false)
            return { allowed: false, limit: 0, current: 0, reason: "Feature not included in plan" };
        }

        const { valor, tipo_valor } = features[0];

        // 3. Check based on type
        if (tipo_valor === 'boolean') {
            const allowed = valor === 'true';
            return { allowed, reason: allowed ? "Allowed" : "Feature disabled in plan" };
        } else if (tipo_valor === 'numeric') {
            const limit = parseInt(valor);
            if (isNaN(limit)) return { allowed: false, reason: "Invalid limit configuration" }; // Should not happen
            if (limit < 0) return { allowed: true, limit: "Unlimited" }; // -1 or similar for unlimited

            // Calculate current usage
            // Context usually provides what to count
            let current = 0;
            if (featureCode === 'MAX_USERS') {
                const [count] = await connection.query(
                    "SELECT COUNT(*) as total FROM usuario WHERE id_tenant = ? AND estado_usuario = 1",
                    [tenantId]
                );
                current = count[0].total;
            } else if (featureCode === 'MAX_BRANCHES') { // Example
                // Assuming sucursal table exists
                // const [count] = await connection.query("SELECT COUNT(*) as total FROM sucursal WHERE id_tenant = ?", [tenantId]);
                // current = count[0].total;
                current = 0; // Placeholder
            }

            if (current >= limit) {
                return { allowed: false, limit, current, reason: `Limit reached (${current}/${limit})` };
            }

            return { allowed: true, limit, current };
        }

        return { allowed: false, reason: "Unknown feature type" };

    } catch (error) {
        console.error("Error in checkLimit:", error);
        throw error; // Let controller handle error
    } finally {
        if (connection) connection.release();
    }
};

export const getLimit = async (tenantId, featureCode) => {
    // Helper to just get the value
    let connection;
    try {
        connection = await getConnection();
        const [users] = await connection.query(
            "SELECT plan_pago FROM usuario WHERE id_tenant = ? AND id_rol = 1 LIMIT 1",
            [tenantId]
        );
        if (users.length === 0 || !users[0].plan_pago) return null;

        const [features] = await connection.query(`
            SELECT pf.valor, f.tipo_valor 
            FROM plan_funciones pf
            JOIN funciones f ON pf.id_funcion = f.id_funciones
            WHERE pf.id_plan = ? AND f.codigo = ?
        `, [users[0].plan_pago, featureCode]);

        if (features.length === 0) return null;
        return features[0];

    } catch (error) {
        console.error(error);
        return null;
    } finally {
        if (connection) connection.release();
    }
}
