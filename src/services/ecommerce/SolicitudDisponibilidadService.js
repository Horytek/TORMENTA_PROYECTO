/**
 * Solicitudes de confirmación de disponibilidad.
 * Solicitud ≠ autorización ≠ reserva soft ≠ pedido ≠ venta.
 */
import { crearReservaManual, cancelarReservaManual } from "./SoftReservaService.js";
import { parseConfig, DEFAULT_CONFIG, parseJsonSafe } from "./DisponibilidadService.js";
import { notificarSolicitudCliente } from "./NotificacionClienteService.js";

const ESTADOS_ABIERTOS = ["pendiente", "en_revision"];

function attrsKey(attrs) {
  const obj = attrs && typeof attrs === "object" ? attrs : {};
  return JSON.stringify(
    Object.keys(obj)
      .sort()
      .reduce((acc, k) => {
        acc[k] = obj[k];
        return acc;
      }, {})
  );
}

async function registrarEvento(connection, {
  id_solicitud,
  id_tienda,
  actor_tipo = "sistema",
  actor_id = null,
  estado_anterior = null,
  estado_nuevo = null,
  payload = null,
}) {
  await connection.query(
    `INSERT INTO ecom_solicitud_evento
      (id_solicitud, id_tienda, actor_tipo, actor_id, estado_anterior, estado_nuevo, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id_solicitud,
      id_tienda,
      actor_tipo,
      actor_id,
      estado_anterior,
      estado_nuevo,
      payload ? JSON.stringify(payload) : null,
    ]
  );
}

async function nextCodigo(connection, id_tienda) {
  const [[row]] = await connection.query(
    `SELECT COUNT(*) AS n FROM ecom_solicitud_disponibilidad WHERE id_tienda = ?`,
    [id_tienda]
  );
  const n = Number(row?.n || 0) + 1;
  return `SOL-${String(n).padStart(4, "0")}`;
}

export async function findDedupePendiente(connection, {
  id_tienda,
  id_usuario,
  id_producto,
  id_sucursal,
  attrs_json,
  cantidad_solicitada,
}) {
  const key = attrsKey(attrs_json);
  const [rows] = await connection.query(
    `SELECT * FROM ecom_solicitud_disponibilidad
     WHERE id_tienda = ? AND id_usuario = ? AND id_producto = ? AND id_sucursal = ?
       AND estado IN ('pendiente','en_revision','aprobada')
       AND (estado <> 'aprobada' OR (expires_at IS NOT NULL AND expires_at > NOW()))
     ORDER BY id_solicitud DESC
     LIMIT 20`,
    [id_tienda, id_usuario, id_producto, id_sucursal]
  );
  return (
    rows.find((r) => {
      const sameAttrs = attrsKey(parseJsonSafe(r.attrs_json)) === key;
      const sameQty = Number(r.cantidad_solicitada) === Number(cantidad_solicitada);
      return sameAttrs && sameQty;
    }) || null
  );
}

export async function crearSolicitud(connection, {
  id_tienda,
  id_usuario,
  nombre_cliente,
  telefono_cliente,
  email_cliente,
  id_producto,
  id_variante,
  sku,
  attrs_json,
  cantidad_solicitada = 1,
  id_sucursal,
  precio_unitario_snapshot,
  theme_json,
}) {
  const cfg = parseConfig(theme_json);
  if (cfg.solicitudes_activas === false) {
    throw Object.assign(new Error("Las solicitudes de disponibilidad están desactivadas."), {
      status: 400,
    });
  }
  const qty = Math.max(1, Number(cantidad_solicitada) || 1);
  const dedupe = await findDedupePendiente(connection, {
    id_tienda,
    id_usuario,
    id_producto,
    id_sucursal,
    attrs_json,
    cantidad_solicitada: qty,
  });
  if (dedupe) {
    return { solicitud: dedupe, duplicated: true };
  }

  const codigo = await nextCodigo(connection, id_tienda);
  const [ins] = await connection.query(
    `INSERT INTO ecom_solicitud_disponibilidad
      (codigo, id_tienda, id_usuario, nombre_cliente, telefono_cliente, email_cliente,
       id_producto, id_variante, sku, attrs_json, cantidad_solicitada, id_sucursal,
       precio_unitario_snapshot, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
    [
      codigo,
      id_tienda,
      id_usuario || null,
      nombre_cliente || null,
      telefono_cliente || null,
      email_cliente || null,
      id_producto,
      id_variante || null,
      sku || null,
      attrs_json ? JSON.stringify(attrs_json) : null,
      qty,
      id_sucursal,
      precio_unitario_snapshot != null ? Number(precio_unitario_snapshot) : null,
    ]
  );
  const solicitud = await getSolicitudById(connection, id_tienda, ins.insertId);
  await registrarEvento(connection, {
    id_solicitud: solicitud.id_solicitud,
    id_tienda,
    actor_tipo: "cliente",
    actor_id: id_usuario || null,
    estado_anterior: null,
    estado_nuevo: "pendiente",
    payload: { codigo },
  });
  return { solicitud, duplicated: false };
}

export async function getSolicitudById(connection, id_tienda, id_solicitud) {
  const [[row]] = await connection.query(
    `SELECT s.*, p.nombre AS producto_nombre, suc.nombre AS sucursal_nombre
     FROM ecom_solicitud_disponibilidad s
     LEFT JOIN producto p ON p.id_producto = s.id_producto AND p.id_tienda = s.id_tienda
     LEFT JOIN ecom_sucursal suc ON suc.id_sucursal = s.id_sucursal AND suc.id_tienda = s.id_tienda
     WHERE s.id_solicitud = ? AND s.id_tienda = ?
     LIMIT 1`,
    [id_solicitud, id_tienda]
  );
  return row || null;
}

export async function listSolicitudesAdmin(
  connection,
  id_tienda,
  { estado, id_sucursal, sucursal_ids, limit = 50, offset = 0 } = {}
) {
  const params = [id_tienda];
  let where = `s.id_tienda = ?`;
  if (estado) {
    where += ` AND s.estado = ?`;
    params.push(estado);
  }
  if (id_sucursal) {
    where += ` AND s.id_sucursal = ?`;
    params.push(id_sucursal);
  } else if (Array.isArray(sucursal_ids) && sucursal_ids.length) {
    where += ` AND s.id_sucursal IN (?)`;
    params.push(sucursal_ids);
  }
  params.push(Number(limit) || 50, Number(offset) || 0);
  const [rows] = await connection.query(
    `SELECT s.*, p.nombre AS producto_nombre, suc.nombre AS sucursal_nombre
     FROM ecom_solicitud_disponibilidad s
     LEFT JOIN producto p ON p.id_producto = s.id_producto AND p.id_tienda = s.id_tienda
     LEFT JOIN ecom_sucursal suc ON suc.id_sucursal = s.id_sucursal AND suc.id_tienda = s.id_tienda
     WHERE ${where}
     ORDER BY
       FIELD(s.estado,'pendiente','en_revision','aprobada','rechazada','expirada','cancelada'),
       s.created_at ASC
     LIMIT ? OFFSET ?`,
    params
  );
  return rows;
}

export async function statsSolicitudes(connection, id_tienda, { id_sucursal, sucursal_ids } = {}) {
  const params = [id_tienda];
  let where = `id_tienda = ?`;
  if (id_sucursal) {
    where += ` AND id_sucursal = ?`;
    params.push(id_sucursal);
  } else if (Array.isArray(sucursal_ids) && sucursal_ids.length) {
    where += ` AND id_sucursal IN (?)`;
    params.push(sucursal_ids);
  }
  const [rows] = await connection.query(
    `SELECT estado, COUNT(*) AS n
     FROM ecom_solicitud_disponibilidad
     WHERE ${where}
     GROUP BY estado`,
    params
  );
  const base = {
    pendiente: 0,
    en_revision: 0,
    aprobada: 0,
    rechazada: 0,
    expirada: 0,
    cancelada: 0,
    total: 0,
  };
  for (const r of rows) {
    base[r.estado] = Number(r.n) || 0;
    base.total += Number(r.n) || 0;
  }
  return base;
}

export async function listSolicitudesBuyer(connection, id_tienda, id_usuario) {
  const [rows] = await connection.query(
    `SELECT s.*, p.nombre AS producto_nombre, suc.nombre AS sucursal_nombre
     FROM ecom_solicitud_disponibilidad s
     LEFT JOIN producto p ON p.id_producto = s.id_producto AND p.id_tienda = s.id_tienda
     LEFT JOIN ecom_sucursal suc ON suc.id_sucursal = s.id_sucursal AND suc.id_tienda = s.id_tienda
     WHERE s.id_tienda = ? AND s.id_usuario = ?
     ORDER BY s.created_at DESC
     LIMIT 100`,
    [id_tienda, id_usuario]
  );
  return rows;
}

export async function marcarEnRevision(connection, id_tienda, id_solicitud, id_usuario_staff) {
  const row = await getSolicitudById(connection, id_tienda, id_solicitud);
  if (!row) throw Object.assign(new Error("Solicitud no encontrada."), { status: 404 });
  if (!ESTADOS_ABIERTOS.includes(row.estado) && row.estado !== "en_revision") {
    throw Object.assign(new Error("La solicitud ya no se puede revisar."), { status: 400 });
  }
  if (row.estado === "pendiente") {
    await connection.query(
      `UPDATE ecom_solicitud_disponibilidad
       SET estado = 'en_revision', id_usuario_staff = ?
       WHERE id_solicitud = ? AND id_tienda = ?`,
      [id_usuario_staff || null, id_solicitud, id_tienda]
    );
    await registrarEvento(connection, {
      id_solicitud,
      id_tienda,
      actor_tipo: "staff",
      actor_id: id_usuario_staff,
      estado_anterior: "pendiente",
      estado_nuevo: "en_revision",
    });
    const updated = await getSolicitudById(connection, id_tienda, id_solicitud);
    await notificarSolicitudCliente(connection, updated, "solicitud_en_revision");
    return updated;
  }
  return getSolicitudById(connection, id_tienda, id_solicitud);
}

export async function aprobarSolicitud(connection, {
  id_tienda,
  id_solicitud,
  id_usuario_staff,
  cantidad_aprobada,
  stock_sistema,
  stock_fisico,
  observacion_stock,
  crear_reserva,
  theme_json,
  congelar_precio,
}) {
  const [[locked]] = await connection.query(
    `SELECT * FROM ecom_solicitud_disponibilidad
     WHERE id_solicitud = ? AND id_tienda = ? FOR UPDATE`,
    [id_solicitud, id_tienda]
  );
  if (!locked) throw Object.assign(new Error("Solicitud no encontrada."), { status: 404 });
  if (!ESTADOS_ABIERTOS.includes(locked.estado) && locked.estado !== "en_revision") {
    throw Object.assign(new Error("La solicitud no está pendiente de aprobación."), { status: 400 });
  }

  const cfg = parseConfig(theme_json);
  const maxQty = Number(locked.cantidad_solicitada) || 1;
  let qty = cantidad_aprobada != null ? Number(cantidad_aprobada) : maxQty;
  if (!Number.isFinite(qty) || qty < 1) qty = maxQty;
  if (qty > maxQty) qty = maxQty;
  if (!cfg.permitir_aprobacion_parcial && qty !== maxQty) {
    throw Object.assign(new Error("La aprobación parcial no está permitida."), { status: 400 });
  }

  const ttl = cfg.validez_confirmacion_min || DEFAULT_CONFIG.validez_confirmacion_min;
  const freeze = congelar_precio === true || cfg.congelar_precio_al_aprobar === true ? 1 : 0;
  let id_reserva = null;

  const shouldReserve =
    crear_reserva === true || (crear_reserva !== false && cfg.reserva_al_aprobar === true);
  if (shouldReserve && locked.id_variante) {
    const reservaMins = cfg.reserva_minutos || ttl;
    try {
      const reserva = await crearReservaManual(connection, {
        id_tienda,
        id_producto: locked.id_producto,
        id_variante: locked.id_variante,
        id_sucursal: locked.id_sucursal,
        cantidad: qty,
        minutos: reservaMins,
        id_usuario_staff,
        id_solicitud: locked.id_solicitud,
        notas: `Solicitud ${locked.codigo}`,
        theme_json,
      });
      id_reserva = reserva.id_reserva;
    } catch (err) {
      // Aprobar igual si falta la tabla de soft-reserva o no hay fila de inventario.
      if (err?.code === "ER_NO_SUCH_TABLE" || err?.status === 400) {
        console.warn(
          "[solicitud-disp] reserva soft omitida al aprobar:",
          err.message || err.code
        );
        id_reserva = null;
      } else {
        throw err;
      }
    }
  }

  await connection.query(
    `UPDATE ecom_solicitud_disponibilidad SET
      estado = 'aprobada',
      cantidad_aprobada = ?,
      expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE),
      id_usuario_staff = ?,
      respondido_at = NOW(),
      stock_sistema = ?,
      stock_fisico = ?,
      observacion_stock = ?,
      id_reserva = ?,
      congelar_precio = ?
     WHERE id_solicitud = ? AND id_tienda = ?`,
    [
      qty,
      ttl,
      id_usuario_staff || null,
      stock_sistema != null ? Number(stock_sistema) : null,
      stock_fisico != null ? Number(stock_fisico) : null,
      observacion_stock || null,
      id_reserva,
      freeze,
      id_solicitud,
      id_tienda,
    ]
  );

  await registrarEvento(connection, {
    id_solicitud,
    id_tienda,
    actor_tipo: "staff",
    actor_id: id_usuario_staff,
    estado_anterior: locked.estado,
    estado_nuevo: "aprobada",
    payload: { cantidad_aprobada: qty, id_reserva, ttl_min: ttl },
  });

  const approved = await getSolicitudById(connection, id_tienda, id_solicitud);
  await notificarSolicitudCliente(connection, approved, "solicitud_aprobada");
  return approved;
}

export async function rechazarSolicitud(connection, {
  id_tienda,
  id_solicitud,
  id_usuario_staff,
  motivo_rechazo,
  comentario_cliente,
  stock_sistema,
  stock_fisico,
  observacion_stock,
}) {
  const [[locked]] = await connection.query(
    `SELECT * FROM ecom_solicitud_disponibilidad
     WHERE id_solicitud = ? AND id_tienda = ? FOR UPDATE`,
    [id_solicitud, id_tienda]
  );
  if (!locked) throw Object.assign(new Error("Solicitud no encontrada."), { status: 404 });
  if (!ESTADOS_ABIERTOS.includes(locked.estado) && locked.estado !== "en_revision") {
    throw Object.assign(new Error("La solicitud no se puede rechazar."), { status: 400 });
  }

  await connection.query(
    `UPDATE ecom_solicitud_disponibilidad SET
      estado = 'rechazada',
      id_usuario_staff = ?,
      respondido_at = NOW(),
      motivo_rechazo = ?,
      comentario_cliente = ?,
      stock_sistema = ?,
      stock_fisico = ?,
      observacion_stock = ?
     WHERE id_solicitud = ? AND id_tienda = ?`,
    [
      id_usuario_staff || null,
      motivo_rechazo || null,
      comentario_cliente || null,
      stock_sistema != null ? Number(stock_sistema) : null,
      stock_fisico != null ? Number(stock_fisico) : null,
      observacion_stock || null,
      id_solicitud,
      id_tienda,
    ]
  );

  await registrarEvento(connection, {
    id_solicitud,
    id_tienda,
    actor_tipo: "staff",
    actor_id: id_usuario_staff,
    estado_anterior: locked.estado,
    estado_nuevo: "rechazada",
    payload: { motivo_rechazo, comentario_cliente },
  });

  const rejected = await getSolicitudById(connection, id_tienda, id_solicitud);
  await notificarSolicitudCliente(connection, rejected, "solicitud_rechazada");
  return rejected;
}

export async function cancelarSolicitud(connection, {
  id_tienda,
  id_solicitud,
  actor_tipo,
  actor_id,
  motivo,
}) {
  const [[locked]] = await connection.query(
    `SELECT * FROM ecom_solicitud_disponibilidad
     WHERE id_solicitud = ? AND id_tienda = ? FOR UPDATE`,
    [id_solicitud, id_tienda]
  );
  if (!locked) throw Object.assign(new Error("Solicitud no encontrada."), { status: 404 });
  if (["cancelada", "expirada", "rechazada"].includes(locked.estado)) {
    throw Object.assign(new Error("La solicitud ya está cerrada."), { status: 400 });
  }

  if (locked.id_reserva) {
    try {
      await cancelarReservaManual(connection, id_tienda, locked.id_reserva);
    } catch {
      /* reserva ya liberada */
    }
  }

  await connection.query(
    `UPDATE ecom_solicitud_disponibilidad SET
      estado = 'cancelada',
      cancelado_por = ?,
      cancelado_at = NOW(),
      motivo_cancelacion = ?,
      id_reserva = NULL
     WHERE id_solicitud = ? AND id_tienda = ?`,
    [actor_tipo === "cliente" ? "cliente" : actor_tipo === "staff" ? "staff" : "sistema", motivo || null, id_solicitud, id_tienda]
  );

  await registrarEvento(connection, {
    id_solicitud,
    id_tienda,
    actor_tipo: actor_tipo || "sistema",
    actor_id: actor_id || null,
    estado_anterior: locked.estado,
    estado_nuevo: "cancelada",
    payload: { motivo },
  });

  const cancelled = await getSolicitudById(connection, id_tienda, id_solicitud);
  // Solo avisar al cliente si canceló el staff/sistema (no si él mismo canceló).
  if (actor_tipo !== "cliente") {
    await notificarSolicitudCliente(connection, cancelled, "solicitud_cancelada");
  }
  return cancelled;
}

export async function expirarSolicitudesVencidas(connection) {
  const [rows] = await connection.query(
    `SELECT id_solicitud, id_tienda, id_reserva, estado
     FROM ecom_solicitud_disponibilidad
     WHERE estado = 'aprobada' AND expires_at IS NOT NULL AND expires_at < NOW()
     LIMIT 100`
  );
  let n = 0;
  for (const r of rows) {
    await connection.beginTransaction();
    try {
      const [[locked]] = await connection.query(
        `SELECT * FROM ecom_solicitud_disponibilidad WHERE id_solicitud = ? FOR UPDATE`,
        [r.id_solicitud]
      );
      if (!locked || locked.estado !== "aprobada") {
        await connection.rollback();
        continue;
      }
      if (locked.id_reserva) {
        try {
          await cancelarReservaManual(connection, locked.id_tienda, locked.id_reserva);
        } catch {
          /* ignore */
        }
      }
      await connection.query(
        `UPDATE ecom_solicitud_disponibilidad
         SET estado = 'expirada', id_reserva = NULL
         WHERE id_solicitud = ?`,
        [r.id_solicitud]
      );
      await registrarEvento(connection, {
        id_solicitud: r.id_solicitud,
        id_tienda: r.id_tienda,
        actor_tipo: "sistema",
        estado_anterior: "aprobada",
        estado_nuevo: "expirada",
        payload: { motivo: "TTL autorización" },
      });
      const expired = await getSolicitudById(connection, r.id_tienda, r.id_solicitud);
      await notificarSolicitudCliente(connection, expired, "solicitud_expirada");
      await connection.commit();
      n += 1;
    } catch (err) {
      await connection.rollback();
      console.error(`[solicitud] expirar ${r.id_solicitud}:`, err.message);
    }
  }
  return n;
}

/** Valida autorización vigente para checkout / comprar ahora. */
export async function assertAutorizacionVigente(connection, {
  id_tienda,
  id_solicitud,
  id_usuario,
  id_producto,
  id_sucursal,
  cantidad,
  attrs_json,
}) {
  const row = await getSolicitudById(connection, id_tienda, id_solicitud);
  if (!row) throw Object.assign(new Error("Solicitud no encontrada."), { status: 404 });
  if (row.estado !== "aprobada") {
    throw Object.assign(new Error("La solicitud no está aprobada."), { status: 400 });
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    throw Object.assign(new Error("La confirmación de disponibilidad ha expirado."), { status: 400 });
  }
  if (id_usuario && row.id_usuario && Number(row.id_usuario) !== Number(id_usuario)) {
    throw Object.assign(new Error("La solicitud no pertenece a este usuario."), { status: 403 });
  }
  if (Number(row.id_producto) !== Number(id_producto)) {
    throw Object.assign(new Error("Producto no coincide con la solicitud."), { status: 400 });
  }
  if (id_sucursal && Number(row.id_sucursal) !== Number(id_sucursal)) {
    throw Object.assign(new Error("Sucursal no coincide con la solicitud."), { status: 400 });
  }
  const maxQty = Number(row.cantidad_aprobada || row.cantidad_solicitada) || 1;
  if (Number(cantidad) > maxQty) {
    throw Object.assign(new Error(`Cantidad máxima autorizada: ${maxQty}.`), { status: 400 });
  }
  if (attrs_json) {
    if (attrsKey(parseJsonSafe(row.attrs_json)) !== attrsKey(attrs_json)) {
      throw Object.assign(new Error("Los atributos no coinciden con la solicitud aprobada."), {
        status: 400,
      });
    }
  }
  return row;
}

export async function getStockSnapshot(connection, { id_tienda, id_variante, id_sucursal }) {
  if (!id_variante || !id_sucursal) {
    return { fisico: 0, reservado: 0, comprometido: 0, disponible: 0 };
  }
  const [[inv]] = await connection.query(
    `SELECT stock_fisico, reservado, comprometido
     FROM ecom_inventario
     WHERE id_tienda = ? AND id_variante = ? AND id_sucursal = ?
     LIMIT 1`,
    [id_tienda, id_variante, id_sucursal]
  );
  if (!inv) return { fisico: 0, reservado: 0, comprometido: 0, disponible: 0 };
  const fisico = Number(inv.stock_fisico) || 0;
  const reservado = Number(inv.reservado) || 0;
  const comprometido = Number(inv.comprometido) || 0;
  return {
    fisico,
    reservado,
    comprometido,
    disponible: Math.max(0, fisico - reservado - comprometido),
  };
}
