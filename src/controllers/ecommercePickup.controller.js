import { getEcommerceConnection } from "../database/database_ecommerce.js";
import {
  puedeTransicionar,
  generarTokensRetiro,
  registrarHistFulfillment,
  parseQrPayload,
} from "../services/ecommerce/PickupService.js";
import { scheduleReviewInvite } from "../services/ecommerce/ReviewService.js";

const ESTADOS_LABEL = {
  pendiente_confirmacion: "Pendiente",
  pago_pendiente: "Pago pendiente",
  pago_confirmado: "Pago confirmado",
  preparando: "Preparando",
  listo_recoger: "Listo para recoger",
  en_camino: "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function mapOrdenPickup(row) {
  let entrega_json = row.entrega_json;
  if (typeof entrega_json === "string") {
    try {
      entrega_json = JSON.parse(entrega_json);
    } catch {
      entrega_json = null;
    }
  }
  return {
    id_orden: row.id_orden,
    codigo: row.codigo,
    estado: row.estado,
    estado_fulfillment: row.estado_fulfillment,
    estado_fulfillment_label: ESTADOS_LABEL[row.estado_fulfillment] || row.estado_fulfillment,
    fulfillment: row.fulfillment || "pickup",
    total: Number(row.total),
    costo_envio: Number(row.costo_envio || 0),
    moneda: row.moneda,
    email_comprador: row.email_comprador,
    nombre_comprador: row.nombre_comprador,
    telefono_comprador: row.telefono_comprador,
    codigo_retiro: row.codigo_retiro,
    id_sucursal: row.id_sucursal,
    sucursal_nombre: row.sucursal_nombre,
    sucursal_direccion: row.sucursal_direccion ?? null,
    pickup_direccion: row.pickup_direccion,
    pickup_ready_at: row.pickup_ready_at,
    delivered_at: row.delivered_at,
    created_at: row.created_at,
    id_zona: row.id_zona ?? null,
    id_destino: row.id_destino ?? null,
    id_agencia: row.id_agencia ?? null,
    entrega_json,
    estado_entrega: row.estado_entrega ?? null,
  };
}

export const listPickupOrdenes = async (req, res) => {
  const { q, estado_fulfillment, sucursal, fulfillment, desde, hasta, page = 1, limit = 30 } = req.query;
  const id_tienda = req.id_tienda;
  let connection;
  try {
    connection = await getEcommerceConnection();
    let sql = `
      SELECT o.id_orden, o.codigo, o.estado, o.estado_fulfillment, o.fulfillment, o.total, o.moneda,
             o.costo_envio, o.email_comprador, o.nombre_comprador, o.telefono_comprador,
             o.codigo_retiro, o.id_sucursal, o.pickup_direccion, o.pickup_ready_at,
             o.id_zona, o.id_destino, o.id_agencia, o.entrega_json, o.estado_entrega,
             o.delivered_at, o.created_at,
             s.nombre AS sucursal_nombre
      FROM orden o
      LEFT JOIN ecom_sucursal s ON s.id_sucursal = o.id_sucursal
      WHERE o.id_tienda = ?
    `;
    const params = [id_tienda];

    if (fulfillment) {
      sql += ` AND o.fulfillment = ?`;
      params.push(String(fulfillment));
    }

    if (estado_fulfillment) {
      sql += ` AND o.estado_fulfillment = ?`;
      params.push(estado_fulfillment);
    }
    if (sucursal) {
      sql += ` AND o.id_sucursal = ?`;
      params.push(Number(sucursal));
    }
    if (desde) {
      sql += ` AND o.created_at >= ?`;
      params.push(desde);
    }
    if (hasta) {
      sql += ` AND o.created_at <= ?`;
      params.push(hasta);
    }
    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      sql += ` AND (
        o.codigo LIKE ? OR o.codigo_retiro LIKE ? OR
        o.email_comprador LIKE ? OR o.nombre_comprador LIKE ? OR
        o.telefono_comprador LIKE ?
      )`;
      params.push(term, term, term, term, term);
    }

    const offset = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit) || 30);
    const lim = Math.min(100, Number(limit) || 30);
    sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(lim, offset);

    const [rows] = await connection.query(sql, params);

    const kpiParams = [id_tienda];
    let kpiWhere = `WHERE id_tienda = ?`;
    if (fulfillment) {
      kpiWhere += ` AND fulfillment = ?`;
      kpiParams.push(String(fulfillment));
    }

    const [[counts]] = await connection.query(
      `SELECT
         SUM(CASE WHEN estado_fulfillment = 'pago_confirmado' THEN 1 ELSE 0 END) AS pendientes,
         SUM(CASE WHEN estado_fulfillment = 'preparando' THEN 1 ELSE 0 END) AS preparando,
         SUM(CASE WHEN estado_fulfillment = 'listo_recoger' THEN 1 ELSE 0 END) AS listos,
         SUM(CASE WHEN estado_fulfillment = 'en_camino' THEN 1 ELSE 0 END) AS en_camino,
         SUM(CASE WHEN estado_fulfillment = 'entregado' AND DATE(delivered_at) = CURDATE() THEN 1 ELSE 0 END) AS entregados_hoy
       FROM orden ${kpiWhere}`,
      kpiParams
    );

    return res.json({
      success: true,
      data: {
        ordenes: rows.map(mapOrdenPickup),
        kpis: {
          pendientes: Number(counts?.pendientes || 0),
          preparando: Number(counts?.preparando || 0),
          listos: Number(counts?.listos || 0),
          en_camino: Number(counts?.en_camino || 0),
          entregados_hoy: Number(counts?.entregados_hoy || 0),
        },
      },
    });
  } catch (error) {
    console.error("[pickup.listOrdenes]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const getPickupOrden = async (req, res) => {
  const id_orden = Number(req.params.id);
  const id_tienda = req.id_tienda;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[orden]] = await connection.query(
      `SELECT o.*, s.nombre AS sucursal_nombre
       FROM orden o
       LEFT JOIN ecom_sucursal s ON s.id_sucursal = o.id_sucursal
       WHERE o.id_orden = ? AND o.id_tienda = ? LIMIT 1`,
      [id_orden, id_tienda]
    );
    if (!orden) {
      return res.status(404).json({ success: false, message: "Pedido no encontrado." });
    }

    const [items] = await connection.query(
      `SELECT id_producto, nombre_snapshot AS nombre, cantidad, precio_unitario
       FROM orden_item WHERE id_orden = ? AND id_tienda = ?`,
      [id_orden, id_tienda]
    );

    const [hist] = await connection.query(
      `SELECT h.*, u.usua AS admin_usuario
       FROM ecom_orden_estado_hist h
       LEFT JOIN usuario u ON u.id_usuario = h.id_usuario
       WHERE h.id_orden = ? AND h.id_tienda = ?
       ORDER BY h.created_at ASC`,
      [id_orden, id_tienda]
    );

    return res.json({
      success: true,
      data: { ...mapOrdenPickup(orden), items, historial: hist },
    });
  } catch (error) {
    console.error("[pickup.getOrden]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const patchPickupEstado = async (req, res) => {
  const id_orden = Number(req.params.id);
  const { estado_fulfillment, notas } = req.body;
  const id_tienda = req.id_tienda;
  const id_usuario = req.ecommerceUser?.id_usuario;
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();

    const [[orden]] = await connection.query(
      `SELECT * FROM orden WHERE id_orden = ? AND id_tienda = ? FOR UPDATE`,
      [id_orden, id_tienda]
    );
    if (!orden) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Pedido no encontrado." });
    }

    const desde = orden.estado_fulfillment || "pago_pendiente";
    if (!puedeTransicionar(desde, estado_fulfillment)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de ${desde} a ${estado_fulfillment}.`,
      });
    }

    let codigo_retiro = orden.codigo_retiro;

    if (estado_fulfillment === "entregado") {
      await connection.query(
        `UPDATE orden SET
           estado_fulfillment = 'entregado',
           delivered_at = NOW(),
           delivered_by = ?,
           delivery_method = 'admin_panel',
           pickup_notas = COALESCE(?, pickup_notas)
         WHERE id_orden = ? AND id_tienda = ?`,
        [id_usuario, notas || null, id_orden, id_tienda]
      );
    } else if (estado_fulfillment === "listo_recoger") {
      const tokens = await generarTokensRetiro(connection, id_tienda);
      codigo_retiro = tokens.codigo_retiro;
      await connection.query(
        `UPDATE orden SET
           estado_fulfillment = ?,
           pickup_token = ?,
           codigo_retiro = ?,
           pickup_ready_at = NOW(),
           pickup_notas = COALESCE(?, pickup_notas)
         WHERE id_orden = ? AND id_tienda = ?`,
        [
          estado_fulfillment,
          tokens.pickup_token,
          tokens.codigo_retiro,
          notas || null,
          id_orden,
          id_tienda,
        ]
      );
    } else if (estado_fulfillment === "en_camino") {
      await connection.query(
        `UPDATE orden SET
           estado_fulfillment = 'en_camino',
           estado_entrega = 'en_camino',
           pickup_notas = COALESCE(?, pickup_notas)
         WHERE id_orden = ? AND id_tienda = ?`,
        [notas || null, id_orden, id_tienda]
      );
    } else {
      await connection.query(
        `UPDATE orden SET
           estado_fulfillment = ?,
           pickup_notas = COALESCE(?, pickup_notas)
         WHERE id_orden = ? AND id_tienda = ?`,
        [estado_fulfillment, notas || null, id_orden, id_tienda]
      );
    }

    await registrarHistFulfillment(connection, {
      id_orden,
      id_tienda,
      estado_anterior: desde,
      estado_nuevo: estado_fulfillment,
      id_usuario,
      id_sucursal: orden.id_sucursal,
      notas,
    });

    await connection.commit();
    if (estado_fulfillment === "entregado") {
      scheduleReviewInvite({ id_orden, id_tienda, id_cliente: orden.id_cliente });
    }
    return res.json({
      success: true,
      data: {
        id_orden,
        estado_fulfillment,
        codigo_retiro: estado_fulfillment === "listo_recoger" ? codigo_retiro : orden.codigo_retiro,
      },
    });
  } catch (error) {
    if (connection) try { await connection.rollback(); } catch { /* noop */ }
    console.error("[pickup.patchEstado]", error);
    return res.status(500).json({ success: false, message: error.message || "Error." });
  } finally {
    if (connection) connection.release();
  }
};

function fulfillmentError(orden) {
  const ef = orden?.estado_fulfillment;
  if (ef === "entregado") {
    return {
      status: 400,
      code: "ALREADY_DELIVERED",
      message: "Este pedido ya fue entregado.",
    };
  }
  if (ef === "cancelado") {
    return {
      status: 400,
      code: "CANCELLED",
      message: "Este pedido está cancelado.",
    };
  }
  if (ef === "preparando" || ef === "pago_confirmado" || ef === "pago_pendiente") {
    return {
      status: 400,
      code: "NOT_READY",
      message: "Este pedido todavía no está listo para recoger.",
    };
  }
  return {
    status: 400,
    code: "NOT_READY",
    message: `Este pedido no está listo para recoger (${ESTADOS_LABEL[ef] || ef}).`,
  };
}

export const validarRetiro = async (req, res) => {
  const { token, codigo, id_sucursal: idSucursalTrabajo } = req.body;
  const id_tienda = req.id_tienda;
  let connection;
  try {
    connection = await getEcommerceConnection();
    let orden = null;
    let delivery_method = null;

    if (token) {
      const parsed = parseQrPayload(token);
      if (!parsed) {
        return res.status(400).json({
          success: false,
          code: "NOT_FOUND",
          message: "Este código no corresponde a un pedido válido.",
        });
      }
      const [[row]] = await connection.query(
        `SELECT o.*, s.nombre AS sucursal_nombre, s.direccion AS sucursal_direccion
         FROM orden o
         LEFT JOIN ecom_sucursal s ON s.id_sucursal = o.id_sucursal
         WHERE o.id_tienda = ? AND o.pickup_token = ? LIMIT 1`,
        [id_tienda, parsed]
      );
      orden = row;
      delivery_method = "qr_scan";
    } else if (codigo) {
      const raw = String(codigo).trim();
      const upper = raw.toUpperCase();
      const sinGuion = upper.replace(/-/g, "");
      const telDigits = raw.replace(/\D/g, "");
      const [[row]] = await connection.query(
        `SELECT o.*, s.nombre AS sucursal_nombre, s.direccion AS sucursal_direccion
         FROM orden o
         LEFT JOIN ecom_sucursal s ON s.id_sucursal = o.id_sucursal
         WHERE o.id_tienda = ?
           AND (
             o.codigo_retiro = ?
             OR REPLACE(UPPER(COALESCE(o.codigo_retiro, '')), '-', '') = ?
             OR UPPER(o.codigo) = ?
             OR (
               ? <> '' AND REPLACE(REPLACE(COALESCE(o.telefono_comprador, ''), ' ', ''), '-', '') LIKE ?
             )
           )
         ORDER BY
           CASE WHEN o.estado_fulfillment = 'listo_recoger' THEN 0 ELSE 1 END,
           o.created_at DESC
         LIMIT 1`,
        [id_tienda, upper, sinGuion, upper, telDigits, telDigits ? `%${telDigits}%` : ""]
      );
      orden = row;
      delivery_method = "manual_code";
    } else {
      return res.status(400).json({
        success: false,
        code: "NOT_FOUND",
        message: "Indica el código QR o un código de búsqueda.",
      });
    }

    if (!orden) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Este código no corresponde a un pedido válido.",
      });
    }

    if (orden.fulfillment && orden.fulfillment !== "pickup") {
      return res.status(400).json({
        success: false,
        code: "NOT_PICKUP",
        message: "Este pedido no es de recojo en tienda.",
        data: mapOrdenPickup(orden),
      });
    }

    if (
      idSucursalTrabajo &&
      orden.id_sucursal &&
      Number(idSucursalTrabajo) !== Number(orden.id_sucursal)
    ) {
      return res.status(400).json({
        success: false,
        code: "WRONG_BRANCH",
        message: "Este pedido debe recogerse en otra sucursal.",
        data: {
          ...mapOrdenPickup(orden),
          sucursal_esperada: orden.sucursal_nombre,
        },
      });
    }

    if (orden.estado_fulfillment !== "listo_recoger") {
      const err = fulfillmentError(orden);
      return res.status(err.status).json({
        success: false,
        code: err.code,
        message: err.message,
        data: mapOrdenPickup(orden),
      });
    }

    const [items] = await connection.query(
      `SELECT nombre_snapshot AS nombre, cantidad, precio_unitario
       FROM orden_item WHERE id_orden = ? AND id_tienda = ?`,
      [orden.id_orden, id_tienda]
    );

    return res.json({
      success: true,
      data: {
        ...mapOrdenPickup(orden),
        items,
        items_count: items.length,
        delivery_method,
        puede_confirmar: true,
      },
    });
  } catch (error) {
    console.error("[pickup.validar]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const confirmarEntrega = async (req, res) => {
  const id_orden = Number(req.params.id_orden);
  const { delivery_method = "admin_panel" } = req.body;
  const id_tienda = req.id_tienda;
  const id_usuario = req.ecommerceUser?.id_usuario;
  let connection;
  try {
    connection = await getEcommerceConnection();
    await connection.beginTransaction();

    const [[orden]] = await connection.query(
      `SELECT * FROM orden WHERE id_orden = ? AND id_tienda = ? FOR UPDATE`,
      [id_orden, id_tienda]
    );
    if (!orden) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Este código no corresponde a un pedido válido.",
      });
    }

    if (orden.estado_fulfillment === "entregado") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        code: "ALREADY_DELIVERED",
        message: "Este pedido ya fue entregado.",
      });
    }

    if (orden.estado_fulfillment !== "listo_recoger") {
      await connection.rollback();
      const err = fulfillmentError(orden);
      return res.status(err.status).json({
        success: false,
        code: err.code,
        message: err.message,
      });
    }

    const desde = orden.estado_fulfillment;
    const [updResult] = await connection.query(
      `UPDATE orden SET
         estado_fulfillment = 'entregado',
         delivered_at = NOW(),
         delivered_by = ?,
         delivery_method = ?
       WHERE id_orden = ? AND id_tienda = ? AND estado_fulfillment = 'listo_recoger'`,
      [id_usuario, delivery_method, id_orden, id_tienda]
    );

    if (!updResult?.affectedRows) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        code: "ALREADY_DELIVERED",
        message: "Este pedido ya fue entregado.",
      });
    }

    await registrarHistFulfillment(connection, {
      id_orden,
      id_tienda,
      estado_anterior: desde,
      estado_nuevo: "entregado",
      id_usuario,
      id_sucursal: orden.id_sucursal,
      notas: `Entrega confirmada (${delivery_method})`,
    });

    await connection.commit();

    scheduleReviewInvite({ id_orden, id_tienda, id_cliente: orden.id_cliente });

    const [[userRow]] = await connection.query(
      `SELECT usua FROM usuario WHERE id_usuario = ? AND id_tienda = ? LIMIT 1`,
      [id_usuario, id_tienda]
    );

    return res.json({
      success: true,
      data: {
        id_orden,
        codigo: orden.codigo,
        estado_fulfillment: "entregado",
        delivered_at: new Date().toISOString(),
        delivered_by: id_usuario,
        empleado: userRow?.usua || null,
      },
    });
  } catch (error) {
    if (connection) try { await connection.rollback(); } catch { /* noop */ }
    console.error("[pickup.confirmarEntrega]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const getPickupDashboardKpis = async (req, res) => {
  const id_tienda = req.id_tienda;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[kpis]] = await connection.query(
      `SELECT
         SUM(CASE WHEN estado_fulfillment = 'pago_confirmado' THEN 1 ELSE 0 END) AS pago_confirmado,
         SUM(CASE WHEN estado_fulfillment = 'preparando' THEN 1 ELSE 0 END) AS preparando,
         SUM(CASE WHEN estado_fulfillment = 'listo_recoger' THEN 1 ELSE 0 END) AS listos_retiro,
         SUM(CASE WHEN estado_fulfillment = 'entregado' AND DATE(delivered_at) = CURDATE() THEN 1 ELSE 0 END) AS entregados_hoy,
         SUM(CASE WHEN estado_fulfillment IN ('pago_pendiente','pago_confirmado','preparando','listo_recoger') THEN 1 ELSE 0 END) AS activos
       FROM orden WHERE id_tienda = ? AND fulfillment = 'pickup'`,
      [id_tienda]
    );
    return res.json({ success: true, data: kpis });
  } catch (error) {
    console.error("[pickup.dashboardKpis]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};
