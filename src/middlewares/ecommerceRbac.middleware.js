import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { loadUserAccess } from "../services/ecommerce/RbacService.js";

/**
 * Carga permisos y sucursales del admin autenticado.
 * Debe ir después de ecommerceAuth.
 */
export const ecommerceAccess = async (req, res, next) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const access = await loadUserAccess(connection, req.id_tienda, req.ecommerceUser.id_usuario);
    if (!access) {
      return res.status(403).json({ success: false, message: "Usuario no encontrado." });
    }
    req.ecomAccess = access;
    req.ecommerceUser = { ...req.ecommerceUser, ...access };
    return next();
  } catch (err) {
    console.error("[ecommerceAccess]", err.message);
    return res.status(500).json({ success: false, message: "Error de autorización." });
  } finally {
    if (connection) connection.release();
  }
};

export function requireEcommercePermiso(codigo) {
  return (req, res, next) => {
    const perms = req.ecomAccess?.permisos || [];
    if (!perms.includes(codigo)) {
      return res.status(403).json({ success: false, message: "No tienes permiso para esta acción." });
    }
    return next();
  };
}

export function requireSucursalScope(getId) {
  return (req, res, next) => {
    const access = req.ecomAccess;
    if (!access) return res.status(403).json({ success: false, message: "Sin acceso." });
    if (access.acceso_global) return next();
    const raw = getId ? getId(req) : req.query.id_sucursal ?? req.query.sucursal ?? req.body?.id_sucursal;
    const id = raw != null && raw !== "" ? Number(raw) : null;
    if (id == null) {
      if (access.sucursal_ids.length === 1) {
        req.id_sucursal_scope = access.sucursal_ids[0];
        return next();
      }
      req.id_sucursal_scope = null;
      return next();
    }
    if (!access.sucursal_ids.includes(id)) {
      return res.status(403).json({ success: false, message: "No tienes acceso a esa sucursal." });
    }
    req.id_sucursal_scope = id;
    return next();
  };
}
