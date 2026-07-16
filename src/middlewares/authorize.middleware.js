import { getConnection } from "../database/database.js";

// Centraliza el check de "usuario Developer/SuperAdmin" que hoy está
// reimplementado con variaciones en permisos.controller.js, permisosGlobales.controller.js
// y rutas.controller.js (algunos miran solo id_rol, otros solo el username, ninguno los dos igual).
export const isDeveloperReq = (req) => {
    const idRol = Number(req.user?.rol);
    return idRol === 10 || req.user?.nameUser === "desarrollador";
};

// Bloquea rutas reservadas a Developer (config global de módulos, sync entre tenants,
// borrado de datos, permisos globales por plan).
export const requireDeveloper = (req, res, next) => {
    if (isDeveloperReq(req)) return next();
    return res.status(403).json({ success: false, message: "Acceso restringido a Developer" });
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
            const [rows] = await connection.query(
                `SELECT p.${accion} AS allowed
                 FROM permisos p
                 LEFT JOIN modulo m ON p.id_modulo = m.id_modulo
                 LEFT JOIN submodulos s ON p.id_submodulo = s.id_submodulo
                 WHERE p.id_rol = ? AND p.id_tenant = ?
                   AND TRIM(LEADING '/' FROM LOWER(TRIM(COALESCE(s.ruta, m.ruta)))) = ?
                 LIMIT 1`,
                [id_rol, id_tenant, slug]
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
