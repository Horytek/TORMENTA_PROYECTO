import { getConnection } from "../database/database.js";

export const tenantStatusMiddleware = async (req, res, next) => {
    // 1. Obtener id_tenant del user (INYECTADO PREVIAMENTE POR VERIFYTOKEN)
    // El verifyToken ya decodificó el JWT y puso req.id_tenant
    // Nota: Si el usuario es 'desarrollador' o superadmin global global, tal vez no tenga tenant o tenga uno especial.

    const id_tenant = req.id_tenant;
    const userRole = req.user?.rol; // Asumiendo que verifyToken llena req.user

    // Exempt developers or specific roles if needed
    if (!id_tenant) {
        // Si no hay tenant (ej. superadmin global sin tenant), pase
        // Ojo: validar si esto es seguro para tu lógica.
        return next();
    }

    // Exempt Login/Public endpoints (handled by route structure, this middleware should be applied after auth)

    let connection;
    try {
        connection = await getConnection();

        // Consultar estado
        // Usamos cache simple en memoria si es necesario, pero por seguridad consultamos DB 
        // o confiamos en el token si decidimos meter 'status' en el JWT (pero el JWT no refresca estado real-time).
        // Para "inmediato", mejor consultar DB o un Redis. Aquí DB por ahora.

        const [rows] = await connection.query(
            "SELECT tenant_status, grace_until FROM empresa WHERE id_empresa = ? LIMIT 1",
            [id_tenant]
        );

        if (rows.length === 0) {
            // Tenant no existe?? Raro si está en JWT.
            return res.status(401).json({ message: "Tenant no válido." });
        }

        const { tenant_status, grace_until } = rows[0];

        if (tenant_status === 'ACTIVE') {
            req.tenant_status = 'ACTIVE';
            return next();
        }

        if (tenant_status === 'GRACE') {
            // Check expiración de gracia
            if (grace_until && new Date(grace_until) < new Date()) {
                // Gracia expirada -> Suspender virtualmente
                return res.status(403).json({
                    message: "Período de gracia expirado. Contacte a soporte.",
                    reason: "GRACE_EXPIRED"
                });
            }
            req.tenant_status = 'GRACE';
            // Podríamos inyectar header de advertencia
            res.set('X-Tenant-Status', 'GRACE');
            return next();
        }

        if (tenant_status === 'SUSPENDED') {
            return res.status(403).json({
                message: "Cuenta suspendida. Contacte al administrador.",
                reason: "SUSPENDED"
            });
        }

        // Default deny
        return res.status(403).json({ message: "Estado de cuenta desconocido." });

    } catch (error) {
        console.error("Error en tenantStatusMiddleware:", error);
        return res.status(500).json({ message: "Error verificando estado de cuenta" });
    } finally {
        if (connection) connection.release();
    }
};
