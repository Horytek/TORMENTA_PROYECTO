import { getEcommerceConnection } from "../database/database_ecommerce.js";
import {
  listAtributos,
  getAtributo,
  createAtributo,
  updateAtributo,
  deleteAtributo,
  addValor,
  updateValor,
  deleteValor,
  listProductosDeAtributo,
  getProductoAtributos,
  setProductoAtributos,
} from "../services/ecommerce/AttributeService.js";

function fail(res, error, fallback = "Error.") {
  const status = error.status || 500;
  if (status >= 500) console.error("[attrs]", error);
  return res.status(status).json({ success: false, message: error.message || fallback });
}

export const adminListAtributos = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await listAtributos(connection, req.id_tienda, req.query);
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminGetAtributo = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await getAtributo(connection, req.id_tienda, Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: "Atributo no encontrado." });
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminCreateAtributo = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await createAtributo(connection, req.id_tienda, req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminUpdateAtributo = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await updateAtributo(connection, req.id_tienda, Number(req.params.id), req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminDeleteAtributo = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await deleteAtributo(connection, req.id_tienda, Number(req.params.id));
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminAddAtributoValor = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await addValor(connection, req.id_tienda, Number(req.params.id), req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminUpdateAtributoValor = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await updateValor(connection, req.id_tienda, Number(req.params.idValor), req.body);
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminDeleteAtributoValor = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await deleteValor(connection, req.id_tienda, Number(req.params.idValor));
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminAtributoProductos = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await listProductosDeAtributo(connection, req.id_tienda, Number(req.params.id));
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminGetProductoAtributos = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await getProductoAtributos(connection, req.id_tienda, Number(req.params.id));
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminSetProductoAtributos = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const data = await setProductoAtributos(
      connection,
      req.id_tienda,
      Number(req.params.id),
      req.body.atributos || []
    );
    return res.json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminListStock = async (req, res) => {
  const q = String(req.query.q || "").trim();
  const estado = String(req.query.estado || "");
  const umbral = Math.max(0, Number(req.query.umbral) || 5);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  let id_sucursal = req.query.id_sucursal ? Number(req.query.id_sucursal) : null;
  if (req.ecomAccess && !req.ecomAccess.acceso_global) {
    if (id_sucursal && !req.ecomAccess.sucursal_ids.includes(id_sucursal)) {
      return res.status(403).json({ success: false, message: "Sucursal no permitida." });
    }
    if (!id_sucursal && req.ecomAccess.sucursal_ids.length === 1) {
      id_sucursal = req.ecomAccess.sucursal_ids[0];
    }
  }
  let connection;
  try {
    connection = await getEcommerceConnection();
    let where = ` WHERE i.id_tienda = ? AND v.activo = 1`;
    const params = [req.id_tienda];
    if (id_sucursal) {
      where += ` AND i.id_sucursal = ?`;
      params.push(id_sucursal);
    } else if (req.ecomAccess && !req.ecomAccess.acceso_global && req.ecomAccess.sucursal_ids.length) {
      where += ` AND i.id_sucursal IN (?)`;
      params.push(req.ecomAccess.sucursal_ids);
    }
    if (q) {
      where += ` AND (p.nombre LIKE ? OR v.sku LIKE ? OR p.sku LIKE ?)`;
      const term = `%${q}%`;
      params.push(term, term, term);
    }
    const dispExpr = `GREATEST(0, i.stock_fisico - i.reservado - i.comprometido)`;
    if (estado === "agotado") {
      where += ` AND ${dispExpr} <= 0`;
    } else if (estado === "bajo") {
      where += ` AND ${dispExpr} > 0 AND ${dispExpr} <= ?`;
      params.push(umbral);
    } else if (estado === "ok") {
      where += ` AND ${dispExpr} > ?`;
      params.push(umbral);
    }

    const fromJoin = `
      FROM ecom_inventario i
      JOIN ecom_variante v ON v.id_variante = i.id_variante AND v.id_tienda = i.id_tienda
      JOIN producto p ON p.id_producto = v.id_producto AND p.id_tienda = i.id_tienda
      JOIN ecom_sucursal s ON s.id_sucursal = i.id_sucursal AND s.id_tienda = i.id_tienda
      ${where}`;

    const [[{ total }]] = await connection.query(`SELECT COUNT(*) AS total ${fromJoin}`, params);
    const [rows] = await connection.query(
      `SELECT p.id_producto, p.nombre AS producto, p.sku AS sku_producto,
              v.id_variante, v.sku, v.talla, v.color, v.attrs_json,
              s.id_sucursal, s.nombre AS sucursal,
              i.stock_fisico, i.reservado, i.comprometido,
              ${dispExpr} AS disponible
       ${fromJoin}
       ORDER BY p.nombre, v.sku, s.nombre
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const data = rows.map((r) => {
      const disponible = Number(r.disponible);
      let status = "ok";
      if (disponible <= 0) status = "agotado";
      else if (disponible <= umbral) status = "bajo";
      return {
        ...r,
        disponible,
        reservado: Number(r.reservado),
        total: Number(r.stock_fisico),
        estado: status,
      };
    });
    return res.json({ success: true, data, total: Number(total) || 0, limit, offset });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};
