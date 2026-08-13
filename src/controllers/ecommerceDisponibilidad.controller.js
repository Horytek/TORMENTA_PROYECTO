import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { FRONTEND_URL } from "../config.js";
import {
  parseConfig,
  parseJsonSafe,
  registrarConsulta,
  DEFAULT_CONFIG,
} from "../services/ecommerce/DisponibilidadService.js";
import { getSucursal } from "../services/ecommerce/BranchService.js";

function fail(res, error) {
  const status = error.status || 500;
  if (status >= 500) console.error("[disponibilidad]", error);
  return res.status(status).json({ success: false, message: error.message || "Error." });
}

export const adminGetDisponibilidadConfig = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[tienda]] = await connection.query(
      `SELECT theme_json, telefono FROM tienda WHERE id_tienda = ? LIMIT 1`,
      [req.id_tienda]
    );
    return res.json({
      success: true,
      data: {
        ...parseConfig(tienda?.theme_json),
        telefono_general: tienda?.telefono || null,
      },
    });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminPatchDisponibilidadConfig = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[tienda]] = await connection.query(
      `SELECT theme_json FROM tienda WHERE id_tienda = ? LIMIT 1`,
      [req.id_tienda]
    );
    const theme = parseJsonSafe(tienda?.theme_json);
    const prev = parseConfig(theme);
    const next = { ...prev, ...req.body };
    theme.disponibilidad = next;
    await connection.query(`UPDATE tienda SET theme_json = ? WHERE id_tienda = ?`, [
      JSON.stringify(theme),
      req.id_tienda,
    ]);
    return res.json({ success: true, data: next });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const adminDisponibilidadStats = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const empty = {
      total: 0,
      productos: [],
      variantes: [],
      sucursales: [],
      alerta: [],
    };
    try {
      const [[tot]] = await connection.query(
        `SELECT COUNT(*) AS c FROM ecom_consulta_disponibilidad WHERE id_tienda = ?`,
        [req.id_tienda]
      );
      const [productos] = await connection.query(
        `SELECT c.id_producto, p.nombre, p.stock, COUNT(*) AS consultas
         FROM ecom_consulta_disponibilidad c
         JOIN producto p ON p.id_producto = c.id_producto AND p.id_tienda = c.id_tienda
         WHERE c.id_tienda = ?
         GROUP BY c.id_producto, p.nombre, p.stock
         ORDER BY consultas DESC LIMIT 10`,
        [req.id_tienda]
      );
      const [variantes] = await connection.query(
        `SELECT c.id_variante, COUNT(*) AS consultas,
                COALESCE(p.nombre, '') AS nombre, v.sku
         FROM ecom_consulta_disponibilidad c
         LEFT JOIN ecom_variante v ON v.id_variante = c.id_variante
         LEFT JOIN producto p ON p.id_producto = c.id_producto AND p.id_tienda = c.id_tienda
         WHERE c.id_tienda = ? AND c.id_variante IS NOT NULL
         GROUP BY c.id_variante, p.nombre, v.sku
         ORDER BY consultas DESC LIMIT 10`,
        [req.id_tienda]
      );
      const [sucursales] = await connection.query(
        `SELECT c.id_sucursal, s.nombre, COUNT(*) AS consultas
         FROM ecom_consulta_disponibilidad c
         LEFT JOIN ecom_sucursal s ON s.id_sucursal = c.id_sucursal AND s.id_tienda = c.id_tienda
         WHERE c.id_tienda = ? AND c.id_sucursal IS NOT NULL
         GROUP BY c.id_sucursal, s.nombre
         ORDER BY consultas DESC LIMIT 10`,
        [req.id_tienda]
      );
      const alerta = (productos || []).filter(
        (p) => Number(p.consultas) >= 5 && Number(p.stock) <= 2
      );
      return res.json({
        success: true,
        data: { total: Number(tot?.c || 0), productos, variantes, sucursales, alerta },
      });
    } catch (err) {
      if (err?.code === "ER_NO_SUCH_TABLE") {
        return res.json({ success: true, data: empty });
      }
      throw err;
    }
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export const storeRegistrarConsulta = async (req, res) => {
  const { slug } = req.params;
  const body = req.body || {};
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda, slug, nombre, telefono, estado FROM tienda WHERE slug = ? LIMIT 1`,
      [slug]
    );
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const id_producto = Number(body.id_producto);
    if (!Number.isInteger(id_producto) || id_producto <= 0) {
      return res.status(400).json({ success: false, message: "Producto inválido." });
    }
    const [[prod]] = await connection.query(
      `SELECT id_producto FROM producto WHERE id_producto = ? AND id_tienda = ? AND activo = 1 LIMIT 1`,
      [id_producto, tienda.id_tienda]
    );
    if (!prod) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }

    let id_sucursal = body.id_sucursal ? Number(body.id_sucursal) : null;
    if (id_sucursal) {
      const suc = await getSucursal(connection, tienda.id_tienda, id_sucursal);
      if (!suc) id_sucursal = null;
    }

    await registrarConsulta(connection, {
      id_tienda: tienda.id_tienda,
      id_producto,
      id_variante: body.id_variante ? Number(body.id_variante) : null,
      id_sucursal,
      cantidad: body.cantidad ? Number(body.cantidad) : 1,
      attrs_snapshot: Array.isArray(body.attrs_snapshot) ? body.attrs_snapshot : null,
      origen: String(body.origen || "producto").slice(0, 40),
    });

    const origin = String(FRONTEND_URL || "").replace(/\/$/, "") || "https://horytek.com";
    return res.json({
      success: true,
      data: {
        product_url: `${origin}/tienda/${tienda.slug}/producto/${id_producto}`,
      },
    });
  } catch (error) {
    return fail(res, error);
  } finally {
    if (connection) connection.release();
  }
};

export { DEFAULT_CONFIG };
