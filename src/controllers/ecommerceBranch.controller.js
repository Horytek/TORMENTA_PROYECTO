import { getEcommerceConnection } from "../database/database_ecommerce.js";
import {
  listSucursalesActivas,
  getSucursal,
  mapPublicSucursal,
} from "../services/ecommerce/BranchService.js";
import {
  calcDisponible,
  getStockPorProductoSucursal,
  getStockTotalProducto,
  getStockMapPorProductos,
  reservarStock,
  liberarReserva,
  confirmarVenta,
  registrarMovimiento,
  getInventario,
  ensureInventarioProducto,
  ensureInventarioTienda,
  ensureInventarioSucursal,
} from "../services/ecommerce/InventoryService.js";
import {
  crearTransferencia,
  cambiarEstadoTransferencia,
} from "../services/ecommerce/TransferService.js";

// ─── Público ─────────────────────────────────────────────────────────────

export const listStoreSucursales = async (req, res) => {
  const { slug } = req.params;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda FROM tienda WHERE slug = ? AND estado = 'active' LIMIT 1`,
      [slug]
    );
    if (!tienda) {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const sucursales = await listSucursalesActivas(connection, tienda.id_tienda);
    return res.json({ success: true, data: sucursales.map(mapPublicSucursal) });
  } catch (error) {
    console.error("[ecommerce.listStoreSucursales]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const searchStore = async (req, res) => {
  const { slug } = req.params;
  const q = String(req.query.q || "").trim();
  const id_sucursal = req.query.branch ? Number(req.query.branch) : null;
  if (q.length < 2) {
    return res.json({ success: true, data: { productos: [], categorias: [] } });
  }
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda FROM tienda WHERE slug = ? AND estado = 'active' LIMIT 1`,
      [slug]
    );
    if (!tienda) {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const like = `%${q}%`;
    const [productos] = await connection.query(
      `SELECT p.id_producto, p.nombre, p.precio, p.categoria, p.sku,
         (SELECT url FROM producto_imagen i
          WHERE i.id_producto = p.id_producto AND i.id_tienda = p.id_tienda
          ORDER BY i.es_principal DESC, i.orden ASC LIMIT 1) AS imagen_url
       FROM producto p
       WHERE p.id_tienda = ? AND p.activo = 1
         AND (p.nombre LIKE ? OR p.sku LIKE ? OR p.categoria LIKE ?)
       ORDER BY p.nombre ASC LIMIT 40`,
      [tienda.id_tienda, like, like, like]
    );

    const stockMap = id_sucursal
      ? await getStockMapPorProductos(connection, tienda.id_tienda, id_sucursal)
      : null;

    for (const p of productos) {
      p.stock = stockMap ? (stockMap.get(p.id_producto) ?? 0) : Number(p.stock ?? 0);
    }
    const filtered = id_sucursal ? productos.filter((p) => p.stock > 0) : productos;

    const [cats] = await connection.query(
      `SELECT DISTINCT categoria FROM producto
       WHERE id_tienda = ? AND activo = 1 AND categoria LIKE ? AND categoria IS NOT NULL
       LIMIT 10`,
      [tienda.id_tienda, like]
    );

    return res.json({
      success: true,
      data: { productos: filtered, categorias: cats.map((c) => c.categoria) },
    });
  } catch (error) {
    console.error("[ecommerce.searchStore]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const getProductAvailability = async (req, res) => {
  const { slug, id } = req.params;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[tienda]] = await connection.query(
      `SELECT id_tienda FROM tienda WHERE slug = ? AND estado = 'active' LIMIT 1`,
      [slug]
    );
    if (!tienda) {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const [[producto]] = await connection.query(
      `SELECT id_producto, nombre FROM producto WHERE id_producto = ? AND id_tienda = ? AND activo = 1 LIMIT 1`,
      [Number(id), tienda.id_tienda]
    );
    if (!producto) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }
    const sucursales = await listSucursalesActivas(connection, tienda.id_tienda);
    const availability = [];
    for (const s of sucursales) {
      const variantes = await getStockPorProductoSucursal(
        connection,
        tienda.id_tienda,
        producto.id_producto,
        s.id_sucursal
      );
      const disponible = variantes.reduce((acc, v) => acc + v.disponible, 0);
      availability.push({
        sucursal: mapPublicSucursal(s),
        disponible,
        variantes,
      });
    }
    return res.json({ success: true, data: availability });
  } catch (error) {
    console.error("[ecommerce.getProductAvailability]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

// ─── Admin sucursales ────────────────────────────────────────────────────

export const adminListSucursales = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const incluirInactivas =
      req.query.incluir_inactivas === "1" ||
      req.query.incluir_inactivas === "true";
    const [rows] = await connection.query(
      incluirInactivas
        ? `SELECT * FROM ecom_sucursal WHERE id_tienda = ? ORDER BY es_default DESC, nombre ASC`
        : `SELECT * FROM ecom_sucursal WHERE id_tienda = ? AND activo = 1 ORDER BY es_default DESC, nombre ASC`,
      [req.id_tienda]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("[ecommerce.adminListSucursales]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminCreateSucursal = async (req, res) => {
  const body = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [ins] = await connection.query(
      `INSERT INTO ecom_sucursal
        (id_tienda, nombre, direccion, lat, lng, horario_json, whatsapp, telefono,
         allow_pickup, allow_delivery, es_default, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.id_tienda,
        body.nombre,
        body.direccion,
        body.lat ?? null,
        body.lng ?? null,
        body.horario_json ? JSON.stringify(body.horario_json) : null,
        body.whatsapp ?? null,
        body.telefono ?? null,
        body.allow_pickup !== false ? 1 : 0,
        body.allow_delivery === true ? 1 : 0,
        body.es_default ? 1 : 0,
        body.activo !== false ? 1 : 0,
      ]
    );
    if (body.es_default) {
      await connection.query(
        `UPDATE ecom_sucursal SET es_default = 0 WHERE id_tienda = ? AND id_sucursal != ?`,
        [req.id_tienda, ins.insertId]
      );
    }
    if (body.activo !== false) {
      await ensureInventarioSucursal(connection, req.id_tienda, ins.insertId);
    }
    return res.status(201).json({ success: true, data: { id_sucursal: ins.insertId } });
  } catch (error) {
    console.error("[ecommerce.adminCreateSucursal]", error);
    return res.status(500).json({ success: false, message: error.message || "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminUpdateSucursal = async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[s]] = await connection.query(
      `SELECT id_sucursal FROM ecom_sucursal WHERE id_sucursal = ? AND id_tienda = ? LIMIT 1`,
      [id, req.id_tienda]
    );
    if (!s) {
      return res.status(404).json({ success: false, message: "Sucursal no encontrada." });
    }
    await connection.query(
      `UPDATE ecom_sucursal SET
        nombre = COALESCE(?, nombre), direccion = COALESCE(?, direccion),
        lat = ?, lng = ?, horario_json = ?,
        whatsapp = ?, telefono = ?,
        allow_pickup = COALESCE(?, allow_pickup),
        allow_delivery = COALESCE(?, allow_delivery),
        es_default = COALESCE(?, es_default), activo = COALESCE(?, activo)
       WHERE id_sucursal = ? AND id_tienda = ?`,
      [
        body.nombre ?? null,
        body.direccion ?? null,
        body.lat ?? null,
        body.lng ?? null,
        body.horario_json !== undefined ? JSON.stringify(body.horario_json) : undefined,
        body.whatsapp ?? null,
        body.telefono ?? null,
        body.allow_pickup !== undefined ? (body.allow_pickup ? 1 : 0) : null,
        body.allow_delivery !== undefined ? (body.allow_delivery ? 1 : 0) : null,
        body.es_default !== undefined ? (body.es_default ? 1 : 0) : null,
        body.activo !== undefined ? (body.activo ? 1 : 0) : null,
        id,
        req.id_tienda,
      ]
    );
    if (body.es_default) {
      await connection.query(
        `UPDATE ecom_sucursal SET es_default = 0 WHERE id_tienda = ? AND id_sucursal != ?`,
        [req.id_tienda, id]
      );
    }
    if (body.activo === true) {
      await ensureInventarioSucursal(connection, req.id_tienda, id);
    }
    return res.json({ success: true, message: "Actualizado." });
  } catch (error) {
    console.error("[ecommerce.adminUpdateSucursal]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminDeleteSucursal = async (req, res) => {
  const id = Number(req.params.id);
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [r] = await connection.query(
      `UPDATE ecom_sucursal SET activo = 0 WHERE id_sucursal = ? AND id_tienda = ?`,
      [id, req.id_tienda]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Sucursal no encontrada." });
    }
    return res.json({ success: true, message: "Desactivada." });
  } catch (error) {
    console.error("[ecommerce.adminDeleteSucursal]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

// ─── Admin inventario ────────────────────────────────────────────────────

export const adminInventarioResumen = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[kpis]] = await connection.query(
      `SELECT
         COUNT(DISTINCT CASE WHEN GREATEST(0, i.stock_fisico - i.reservado - i.comprometido) = 0 THEN v.id_variante END) AS agotados,
         COUNT(DISTINCT CASE WHEN GREATEST(0, i.stock_fisico - i.reservado - i.comprometido) <= i.stock_min AND i.stock_min > 0 THEN v.id_variante END) AS stock_bajo,
         COALESCE(SUM(i.reservado), 0) AS reservado_total,
         COALESCE(SUM(i.en_transito), 0) AS en_transito_total
       FROM ecom_inventario i
       JOIN ecom_variante v ON v.id_variante = i.id_variante
       WHERE i.id_tienda = ?`,
      [req.id_tienda]
    );
    const [[trans]] = await connection.query(
      `SELECT COUNT(*) AS pendientes FROM ecom_transferencia
       WHERE id_tienda = ? AND estado IN ('solicitada','en_transito')`,
      [req.id_tienda]
    );
    return res.json({
      success: true,
      data: { ...kpis, transferencias_pendientes: trans.pendientes },
    });
  } catch (error) {
    console.error("[ecommerce.adminInventarioResumen]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminInventarioMatriz = async (req, res) => {
  const id_sucursal = req.query.sucursal ? Number(req.query.sucursal) : null;
  // Paginamos por producto (no por fila sucursal) para agrupar limpio en UI.
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  let connection;
  try {
    connection = await getEcommerceConnection();
    // Materializa stock producto×sucursal si faltaba (idempotente).
    await ensureInventarioTienda(connection, req.id_tienda);

    let where = ` WHERE p.id_tienda = ? AND p.activo = 1 AND s.activo = 1`;
    const params = [req.id_tienda];
    if (id_sucursal) {
      where += ` AND s.id_sucursal = ?`;
      params.push(id_sucursal);
    }
    if (q) {
      where += ` AND (p.nombre LIKE ? OR p.sku LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like);
    }

    const [[{ total }]] = await connection.query(
      `SELECT COUNT(DISTINCT p.id_producto) AS total
       FROM producto p
       JOIN ecom_variante v ON v.id_producto = p.id_producto AND v.id_tienda = p.id_tienda
       JOIN ecom_inventario i ON i.id_variante = v.id_variante AND i.id_tienda = p.id_tienda
       JOIN ecom_sucursal s ON s.id_sucursal = i.id_sucursal AND s.id_tienda = p.id_tienda
       ${where}`,
      params
    );

    const [productIds] = await connection.query(
      `SELECT p.id_producto
       FROM producto p
       JOIN ecom_variante v ON v.id_producto = p.id_producto AND v.id_tienda = p.id_tienda
       JOIN ecom_inventario i ON i.id_variante = v.id_variante AND i.id_tienda = p.id_tienda
       JOIN ecom_sucursal s ON s.id_sucursal = i.id_sucursal AND s.id_tienda = p.id_tienda
       ${where}
       GROUP BY p.id_producto, p.nombre
       ORDER BY p.nombre
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    if (!productIds.length) {
      return res.json({ success: true, data: [], total: Number(total), limit, offset });
    }

    const ids = productIds.map((r) => r.id_producto);
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await connection.query(
      `SELECT p.id_producto, p.nombre, p.sku, p.categoria,
              s.id_sucursal, s.nombre AS sucursal_nombre,
              v.id_variante, v.talla, v.color,
              i.stock_fisico, i.reservado, i.comprometido, i.en_transito, i.stock_min
       FROM producto p
       JOIN ecom_variante v ON v.id_producto = p.id_producto AND v.id_tienda = p.id_tienda
       JOIN ecom_inventario i ON i.id_variante = v.id_variante AND i.id_tienda = p.id_tienda
       JOIN ecom_sucursal s ON s.id_sucursal = i.id_sucursal AND s.id_tienda = p.id_tienda
       WHERE p.id_tienda = ? AND p.id_producto IN (${placeholders}) AND s.activo = 1
         ${id_sucursal ? "AND s.id_sucursal = ?" : ""}
       ORDER BY p.nombre, s.nombre, v.id_variante`,
      id_sucursal ? [req.id_tienda, ...ids, id_sucursal] : [req.id_tienda, ...ids]
    );
    const data = rows.map((r) => ({ ...r, disponible: calcDisponible(r) }));
    return res.json({ success: true, data, total: Number(total), limit, offset });
  } catch (error) {
    console.error("[ecommerce.adminInventarioMatriz]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminAjustarInventario = async (req, res) => {
  const { id_variante, id_sucursal, delta, motivo } = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();
    const inv = await getInventario(connection, req.id_tienda, id_variante, id_sucursal, true);
    if (!inv) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Inventario no encontrado." });
    }
    const antes = Number(inv.stock_fisico);
    const despues = Math.max(0, antes + Number(delta));
    await connection.query(
      `UPDATE ecom_inventario SET stock_fisico = ? WHERE id_inventario = ? AND id_tienda = ?`,
      [despues, inv.id_inventario, req.id_tienda]
    );
    await registrarMovimiento(connection, {
      id_tienda: req.id_tienda,
      id_variante,
      id_sucursal,
      tipo: "ajuste",
      cantidad: Math.abs(delta),
      stock_antes: antes,
      stock_despues: despues,
      id_usuario: req.user?.sub ?? null,
      motivo: motivo || "Ajuste manual",
    });
    await connection.commit();
    return res.json({ success: true, data: { stock_fisico: despues } });
  } catch (error) {
    if (connection) try { await connection.rollback(); } catch { /* noop */ }
    console.error("[ecommerce.adminAjustarInventario]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminListMovimientos = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [rows] = await connection.query(
      `SELECT m.*, s.nombre AS sucursal_nombre, p.nombre AS producto_nombre
       FROM ecom_inventario_mov m
       LEFT JOIN ecom_sucursal s ON s.id_sucursal = m.id_sucursal
       LEFT JOIN ecom_variante v ON v.id_variante = m.id_variante
       LEFT JOIN producto p ON p.id_producto = v.id_producto
       WHERE m.id_tienda = ?
       ORDER BY m.created_at DESC LIMIT ?`,
      [req.id_tienda, limit]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("[ecommerce.adminListMovimientos]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

// ─── Admin transferencias ────────────────────────────────────────────────

export const adminListTransferencias = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [rows] = await connection.query(
      `SELECT t.*,
         so.nombre AS origen_nombre, sd.nombre AS destino_nombre
       FROM ecom_transferencia t
       JOIN ecom_sucursal so ON so.id_sucursal = t.id_sucursal_origen
       JOIN ecom_sucursal sd ON sd.id_sucursal = t.id_sucursal_destino
       WHERE t.id_tienda = ?
       ORDER BY t.created_at DESC LIMIT 100`,
      [req.id_tienda]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("[ecommerce.adminListTransferencias]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminSearchVariantes = async (req, res) => {
  const qRaw = String(req.query.q || "").trim();
  const q = qRaw;
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 30);
  if (q.length < 2) {
    return res.json({ success: true, data: [] });
  }
  let connection;
  try {
    connection = await getEcommerceConnection();
    const like = `%${q}%`;
    const [rows] = await connection.query(
      `SELECT v.id_variante,
              v.id_producto,
              p.nombre AS producto_nombre,
              p.sku AS producto_sku,
              v.sku AS variante_sku,
              v.talla,
              v.color
       FROM ecom_variante v
       JOIN producto p ON p.id_producto = v.id_producto AND p.id_tienda = v.id_tienda
       WHERE v.id_tienda = ?
         AND v.activo = 1
         AND p.activo = 1
         AND (
              p.nombre LIKE ?
           OR p.sku LIKE ?
           OR v.sku LIKE ?
           OR v.talla LIKE ?
           OR v.color LIKE ?
         )
       ORDER BY p.nombre ASC, v.id_variante ASC
       LIMIT ?`,
      [req.id_tienda, like, like, like, like, like, limit]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("[ecommerce.adminSearchVariantes]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminCreateTransferencia = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();
    const id = await crearTransferencia(connection, {
      id_tienda: req.id_tienda,
      id_sucursal_origen: req.body.id_sucursal_origen,
      id_sucursal_destino: req.body.id_sucursal_destino,
      lineas: req.body.lineas,
      notas: req.body.notas,
      id_usuario: req.user?.sub ?? null,
    });
    await connection.commit();
    return res.status(201).json({ success: true, data: { id_transferencia: id } });
  } catch (error) {
    if (connection) try { await connection.rollback(); } catch { /* noop */ }
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminUpdateTransferenciaEstado = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();
    await cambiarEstadoTransferencia(
      connection,
      req.id_tienda,
      Number(req.params.id),
      req.body.estado,
      req.user?.sub ?? null
    );
    await connection.commit();
    return res.json({ success: true, message: "Estado actualizado." });
  } catch (error) {
    if (connection) try { await connection.rollback(); } catch { /* noop */ }
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || "Error." });
  } finally {
    if (connection) connection.release();
  }
};
