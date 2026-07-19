import { getConnection } from "../database/database.js";

// Centraliza el check de "usuario Developer/SuperAdmin" que hoy está
// reimplementado con variaciones en permisos.controller.js, permisosGlobales.controller.js
// y rutas.controller.js (algunos miran solo id_rol, otros solo el username, ninguno los dos igual).
export const DEVELOPER_ROLE_ID = 10;

export const isDeveloperReq = (req) => {
    // Solo por rol. Antes también aceptaba `nameUser === "desarrollador"`, pero
    // `usuario.usua` no es único entre tenants: cualquier tenant que creara un
    // usuario con ese nombre obtenía acceso Developer total (escalación de
    // privilegios cross-tenant). El usuario developer real ya tiene id_rol=10.
    return Number(req.user?.rol) === DEVELOPER_ROLE_ID;
};

// Bloquea rutas reservadas a Developer (config global de módulos, sync entre tenants,
// borrado de datos, permisos globales por plan).
export const requireDeveloper = (req, res, next) => {
    if (isDeveloperReq(req)) return next();
    return res.status(403).json({ success: false, message: "Acceso restringido a Developer" });
};

/** id_rol reservado para el Administrador/titular de cada tenant. */
export const ADMIN_ROLE_ID = 1;

// Rutas de gestión del tenant sin módulo/capability en BD (suscripción, logs de
// auditoría): mismas pantallas que el frontend ya gatea a rol admin.
export const requireAdmin = (req, res, next) => {
    const idRol = Number(req.user?.rol);
    if (idRol === ADMIN_ROLE_ID || isDeveloperReq(req)) return next();
    return res.status(403).json({ success: false, message: "Acceso restringido al Administrador" });
};

const normalizeRuta = (ruta) =>
    (ruta || "").toString().trim().toLowerCase().replace(/^\/+/, "");

const ACCIONES_VALIDAS = new Set(["ver", "crear", "editar", "eliminar", "desactivar", "generar"]);

/**
 * Exige que el rol del usuario tenga la acción habilitada para el módulo/submódulo
 * cuya `ruta` (en BD) coincide con `rutaSlug`. Reutiliza la tabla `permisos` que ya
 * alimenta las capabilities del frontend (client-v2/src/store/useUserStore.ts) — no
 * agrega tablas nuevas. Developer (id_rol=10 o usuario "desarrollador") siempre pasa.
 */
export const requireCapability = (rutaSlug, accion) => {
    if (!ACCIONES_VALIDAS.has(accion)) {
        throw new Error(`requireCapability: acción de permiso inválida "${accion}"`);
    }
    const slug = normalizeRuta(rutaSlug);

    return async (req, res, next) => {
        if (isDeveloperReq(req)) return next();

        const id_rol = Number(req.user?.rol);
        const id_tenant = req.id_tenant;
        if (!id_rol || !id_tenant) {
            return res.status(403).json({ success: false, message: "No autorizado" });
        }

        let connection;
        try {
            connection = await getConnection();
            // Misma semántica de plan que AuthZService.getEffectivePermissions:
            // solo cuentan el default del plan del tenant (id_plan = plan del
            // titular, mismo criterio que resolvePlanId) y el override del
            // tenant (id_plan IS NULL), y el override gana (ORDER BY). Antes no
            // se filtraba id_plan y el LIMIT 1 elegía una fila arbitraria —
            // podía aplicar el default de OTRO plan o ignorar el override.
            const [rows] = await connection.query(
                `SELECT p.${accion} AS allowed
                 FROM permisos p
                 LEFT JOIN modulo m ON p.id_modulo = m.id_modulo
                 LEFT JOIN submodulos s ON p.id_submodulo = s.id_submodulo
                 WHERE p.id_rol = ? AND p.id_tenant = ?
                   AND (p.id_plan IS NULL OR p.id_plan = (
                        SELECT u.plan_pago FROM usuario u
                        WHERE u.id_tenant = ? AND u.id_rol = 1
                        ORDER BY u.id_usuario ASC LIMIT 1
                   ))
                   AND TRIM(LEADING '/' FROM LOWER(TRIM(COALESCE(s.ruta, m.ruta)))) = ?
                 ORDER BY (p.id_plan IS NULL) DESC
                 LIMIT 1`,
                [id_rol, id_tenant, id_tenant, slug]
            );
            const allowed = rows.length > 0 && Number(rows[0].allowed) === 1;
            if (!allowed) {
                return res.status(403).json({ success: false, message: "No tienes permiso para realizar esta acción" });
            }
            return next();
        } catch (error) {
            console.error("Error en requireCapability:", error);
            return res.status(500).json({ success: false, message: "Error al verificar permisos" });
        } finally {
            if (connection) connection.release();
        }
    };
};
