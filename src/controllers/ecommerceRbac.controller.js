import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { hashPassword } from "../utils/passwordUtil.js";
import {
  listRoles,
  listPermisosCatalogo,
  updateRolPermisos,
  listUsuarios,
  createUsuario,
  updateUsuario,
} from "../services/ecommerce/RbacService.js";

function fail(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[rbac]", error);
  return res.status(status).json({ success: false, message: error.message || "Error." });
}

export const adminListRoles = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [roles, permisos] = await Promise.all([
      listRoles(connection, req.id_tienda),
      listPermisosCatalogo(connection),
    ]);
    return res.json({ success: true, data: { roles, permisos } });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminPatchRol = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await updateRolPermisos(
      connection,
      req.id_tienda,
      Number(req.params.id),
      req.body
    );
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminListUsuarios = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await listUsuarios(connection, req.id_tienda);
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminCreateUsuario = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await createUsuario(connection, req.id_tienda, req.body, hashPassword);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminUpdateUsuario = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await updateUsuario(connection, req.id_tienda, Number(req.params.id), req.body, hashPassword);
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};
