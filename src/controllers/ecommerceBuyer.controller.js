import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { hashPassword, verifyPassword } from "../utils/passwordUtil.js";
import { resolveTiendaBySlug } from "../middlewares/storefrontAuth.middleware.js";
import {
  getStockTotalProducto,
  getStockMapPorProductos,
} from "../services/ecommerce/InventoryService.js";
import { listSucursalesActivas } from "../services/ecommerce/BranchService.js";
import { registrarHistFulfillment } from "../services/ecommerce/PickupService.js";

const BUYER_TOKEN_OPTS = {
  expiresIn: "30d",
  algorithm: "HS256",
  issuer: "horytek-backend",
  audience: "horytek-ecommerce-buyer",
};

function signBuyerToken(cliente, tienda) {
  return jwt.sign(
    { sub: cliente.id_cliente, ten: tienda.id_tienda, slug: tienda.slug, em: cliente.email },
    TOKEN_SECRET,
    BUYER_TOKEN_OPTS
  );
}

function mapClientePublico(row) {
  return {
    id_cliente: row.id_cliente,
    email: row.email,
    nombre: row.nombre,
    telefono: row.telefono,
    id_tienda: row.id_tienda,
    slug: row.slug,
  };
}

export const registerBuyer = async (req, res) => {
  const { slug } = req.params;
  const { email, password, nombre, telefono } = req.body;
  let connection;
  try {
    const tienda = await resolveTiendaBySlug(slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }

    connection = await getEcommerceConnection();
    const [[exists]] = await connection.query(
      `SELECT id_cliente FROM ecom_cliente WHERE id_tienda = ? AND email = ? LIMIT 1`,
      [tienda.id_tienda, email.toLowerCase().trim()]
    );
    if (exists) {
      return res.status(409).json({ success: false, message: "Este correo ya está registrado." });
    }

    const password_hash = await hashPassword(password);
    const [ins] = await connection.query(
      `INSERT INTO ecom_cliente (id_tienda, email, password_hash, nombre, telefono)
       VALUES (?, ?, ?, ?, ?)`,
      [tienda.id_tienda, email.toLowerCase().trim(), password_hash, nombre.trim(), telefono || null]
    );

    const cliente = {
      id_cliente: ins.insertId,
      email: email.toLowerCase().trim(),
      nombre: nombre.trim(),
      telefono: telefono || null,
      id_tienda: tienda.id_tienda,
      slug: tienda.slug,
    };
    const token = signBuyerToken(cliente, tienda);
    return res.status(201).json({
      success: true,
      data: { token, user: mapClientePublico(cliente) },
    });
  } catch (error) {
    console.error("[buyer.register]", error);
    return res.status(500).json({ success: false, message: "Error al registrar." });
  } finally {
    if (connection) connection.release();
  }
};

export const loginBuyer = async (req, res) => {
  const { slug } = req.params;
  const { email, password } = req.body;
  let connection;
  try {
    const tienda = await resolveTiendaBySlug(slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }

    connection = await getEcommerceConnection();
    const [[cliente]] = await connection.query(
      `SELECT id_cliente, id_tienda, email, password_hash, nombre, telefono, activo
       FROM ecom_cliente WHERE id_tienda = ? AND email = ? LIMIT 1`,
      [tienda.id_tienda, email.toLowerCase().trim()]
    );
    if (!cliente || !cliente.activo) {
      return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
    }

    const ok = await verifyPassword(password, cliente.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
    }

    const user = { ...cliente, slug: tienda.slug };
    const token = signBuyerToken(cliente, tienda);
    return res.json({
      success: true,
      data: { token, user: mapClientePublico(user) },
    });
  } catch (error) {
    console.error("[buyer.login]", error);
    return res.status(500).json({ success: false, message: "Error al iniciar sesión." });
  } finally {
    if (connection) connection.release();
  }
};

export const meBuyer = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const id_tienda = req.id_tienda;
    const id_cliente = req.id_cliente;

    const [[stats]] = await connection.query(
      `SELECT
         COUNT(*) AS total_pedidos,
         SUM(CASE WHEN estado_fulfillment IN ('pago_pendiente','pago_confirmado','preparando','listo_recoger') THEN 1 ELSE 0 END) AS pedidos_activos,
         SUM(CASE WHEN estado_fulfillment = 'listo_recoger' THEN 1 ELSE 0 END) AS listos_retiro
       FROM orden WHERE id_tienda = ? AND id_cliente = ?`,
      [id_tienda, id_cliente]
    );

    const [[favCount]] = await connection.query(
      `SELECT COUNT(*) AS total FROM ecom_favorito WHERE id_tienda = ? AND id_cliente = ?`,
      [id_tienda, id_cliente]
    );

    return res.json({
      success: true,
      data: {
        user: mapClientePublico({ ...req.storefrontUser, id_tienda }),
        stats: {
          total_pedidos: Number(stats?.total_pedidos || 0),
          pedidos_activos: Number(stats?.pedidos_activos || 0),
          listos_retiro: Number(stats?.listos_retiro || 0),
          total_favoritos: Number(favCount?.total || 0),
        },
      },
    });
  } catch (error) {
    console.error("[buyer.me]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const updateBuyerProfile = async (req, res) => {
  const { nombre, telefono } = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.query(
      `UPDATE ecom_cliente SET nombre = ?, telefono = ? WHERE id_cliente = ? AND id_tienda = ?`,
      [nombre.trim(), telefono || null, req.id_cliente, req.id_tienda]
    );
    return res.json({
      success: true,
      data: {
        user: mapClientePublico({
          ...req.storefrontUser,
          nombre: nombre.trim(),
          telefono: telefono || null,
          id_tienda: req.id_tienda,
        }),
      },
    });
  } catch (error) {
    console.error("[buyer.updateProfile]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const changeBuyerPassword = async (req, res) => {
  const { password_actual, password_nueva } = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[cliente]] = await connection.query(
      `SELECT password_hash FROM ecom_cliente WHERE id_cliente = ? AND id_tienda = ? LIMIT 1`,
      [req.id_cliente, req.id_tienda]
    );
    if (!cliente) {
      return res.status(404).json({ success: false, message: "Cuenta no encontrada." });
    }
    const ok = await verifyPassword(password_actual, cliente.password_hash);
    if (!ok) {
      return res.status(400).json({ success: false, message: "Contraseña actual incorrecta." });
    }
    const password_hash = await hashPassword(password_nueva);
    await connection.query(
      `UPDATE ecom_cliente SET password_hash = ? WHERE id_cliente = ? AND id_tienda = ?`,
      [password_hash, req.id_cliente, req.id_tienda]
    );
    return res.json({ success: true, message: "Contraseña actualizada." });
  } catch (error) {
    console.error("[buyer.changePassword]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

async function mapProductoFavorito(connection, id_tienda, row) {
  const sucursales = await listSucursalesActivas(connection, id_tienda);
  let stock = row.stock;
  if (sucursales.length > 0) {
    stock = await getStockTotalProducto(connection, id_tienda, row.id_producto);
  }
  return {
    id_producto: row.id_producto,
    nombre: row.nombre,
    precio: Number(row.precio),
    stock,
    activo: Boolean(row.activo),
    imagen_url: row.imagen_url,
    attrs_json: row.attrs_json,
    favorito_desde: row.created_at,
  };
}

export const listFavoritos = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [rows] = await connection.query(
      `SELECT p.id_producto, p.nombre, p.precio, p.stock, p.activo, p.attrs_json,
              (SELECT url FROM producto_imagen WHERE id_producto = p.id_producto ORDER BY orden LIMIT 1) AS imagen_url,
              f.created_at
       FROM ecom_favorito f
       INNER JOIN producto p ON p.id_producto = f.id_producto AND p.id_tienda = f.id_tienda
       WHERE f.id_tienda = ? AND f.id_cliente = ?
       ORDER BY f.created_at DESC`,
      [req.id_tienda, req.id_cliente]
    );
    const data = [];
    for (const row of rows) {
      data.push(await mapProductoFavorito(connection, req.id_tienda, row));
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[buyer.listFavoritos]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const toggleFavorito = async (req, res) => {
  const id_producto = Number(req.params.id_producto);
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[prod]] = await connection.query(
      `SELECT id_producto FROM producto WHERE id_producto = ? AND id_tienda = ? AND activo = 1 LIMIT 1`,
      [id_producto, req.id_tienda]
    );
    if (!prod) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }

    const [[exists]] = await connection.query(
      `SELECT id_favorito FROM ecom_favorito WHERE id_tienda = ? AND id_cliente = ? AND id_producto = ? LIMIT 1`,
      [req.id_tienda, req.id_cliente, id_producto]
    );

    if (exists) {
      await connection.query(
        `DELETE FROM ecom_favorito WHERE id_favorito = ? AND id_tienda = ? AND id_cliente = ?`,
        [exists.id_favorito, req.id_tienda, req.id_cliente]
      );
      return res.json({ success: true, data: { favorito: false } });
    }

    await connection.query(
      `INSERT INTO ecom_favorito (id_tienda, id_cliente, id_producto) VALUES (?, ?, ?)`,
      [req.id_tienda, req.id_cliente, id_producto]
    );
    return res.json({ success: true, data: { favorito: true } });
  } catch (error) {
    console.error("[buyer.toggleFavorito]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const deleteFavorito = async (req, res) => {
  const id_producto = Number(req.params.id_producto);
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.query(
      `DELETE FROM ecom_favorito WHERE id_tienda = ? AND id_cliente = ? AND id_producto = ?`,
      [req.id_tienda, req.id_cliente, id_producto]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error("[buyer.deleteFavorito]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const listMisPedidos = async (req, res) => {
  const estado = req.query.estado_fulfillment;
  let connection;
  try {
    connection = await getEcommerceConnection();
    let sql = `
      SELECT o.id_orden, o.codigo, o.estado, o.estado_fulfillment, o.total, o.moneda,
             o.created_at, o.pickup_direccion, o.codigo_retiro,
             s.nombre AS sucursal_nombre
      FROM orden o
      LEFT JOIN ecom_sucursal s ON s.id_sucursal = o.id_sucursal
      WHERE o.id_tienda = ? AND o.id_cliente = ?
    `;
    const params = [req.id_tienda, req.id_cliente];
    if (estado) {
      sql += ` AND o.estado_fulfillment = ?`;
      params.push(estado);
    }
    sql += ` ORDER BY o.created_at DESC LIMIT 100`;
    const [rows] = await connection.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("[buyer.listMisPedidos]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const getMisPedido = async (req, res) => {
  const id_orden = Number(req.params.id_orden);
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[orden]] = await connection.query(
      `SELECT o.*, s.nombre AS sucursal_nombre, s.direccion AS sucursal_direccion,
              s.telefono AS sucursal_telefono, s.whatsapp AS sucursal_whatsapp, s.horario_json
       FROM orden o
       LEFT JOIN ecom_sucursal s ON s.id_sucursal = o.id_sucursal
       WHERE o.id_orden = ? AND o.id_tienda = ? AND o.id_cliente = ? LIMIT 1`,
      [id_orden, req.id_tienda, req.id_cliente]
    );
    if (!orden) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado." });
    }

    const [items] = await connection.query(
      `SELECT id_producto, nombre_snapshot AS nombre, cantidad, precio_unitario
       FROM orden_item WHERE id_orden = ? AND id_tienda = ?`,
      [id_orden, req.id_tienda]
    );

    const [hist] = await connection.query(
      `SELECT estado_anterior, estado_nuevo, notas, created_at
       FROM ecom_orden_estado_hist WHERE id_orden = ? AND id_tienda = ?
       ORDER BY created_at ASC`,
      [id_orden, req.id_tienda]
    );

    const data = {
      ...orden,
      items,
      historial: hist,
      qr_payload:
        orden.estado_fulfillment === "listo_recoger" && orden.pickup_token
          ? `HORYTEK-PICKUP:${orden.pickup_token}`
          : null,
      codigo_retiro_visible:
        ["listo_recoger", "entregado"].includes(orden.estado_fulfillment)
          ? orden.codigo_retiro
          : null,
    };
    delete data.pickup_token;

    return res.json({ success: true, data });
  } catch (error) {
    console.error("[buyer.getMisPedido]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const getMisPedidoQr = async (req, res) => {
  const id_orden = Number(req.params.id_orden);
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[orden]] = await connection.query(
      `SELECT o.codigo, o.estado_fulfillment, o.pickup_token, o.codigo_retiro,
              s.nombre AS sucursal_nombre
       FROM orden o
       LEFT JOIN ecom_sucursal s ON s.id_sucursal = o.id_sucursal
       WHERE o.id_orden = ? AND o.id_tienda = ? AND o.id_cliente = ? LIMIT 1`,
      [id_orden, req.id_tienda, req.id_cliente]
    );
    if (!orden) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado." });
    }
    if (orden.estado_fulfillment !== "listo_recoger" || !orden.pickup_token) {
      return res.status(400).json({
        success: false,
        code: "NOT_READY",
        message: "El pedido no está listo para retiro.",
      });
    }
    return res.json({
      success: true,
      data: {
        qr_payload: `HORYTEK-PICKUP:${orden.pickup_token}`,
        codigo: orden.codigo,
        codigo_retiro: orden.codigo_retiro,
        sucursal_nombre: orden.sucursal_nombre,
      },
    });
  } catch (error) {
    console.error("[buyer.getMisPedidoQr]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

/** Registro histórico al crear orden */
export async function registrarOrdenCreada(connection, id_orden, id_tienda) {
  await registrarHistFulfillment(connection, {
    id_orden,
    id_tienda,
    estado_anterior: null,
    estado_nuevo: "pago_pendiente",
    notas: "Orden creada",
  });
}
