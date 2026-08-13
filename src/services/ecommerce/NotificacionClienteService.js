/**
 * Inbox in-app del comprador (storefront).
 * Aislamiento: siempre filtrar por id_tienda + id_cliente.
 */

export const TIPOS_NOTIF = [
  "solicitud_aprobada",
  "solicitud_rechazada",
  "solicitud_expirada",
  "solicitud_en_revision",
  "solicitud_cancelada",
];

function parsePayload(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

export function mapNotificacion(row) {
  if (!row) return null;
  return {
    id_notificacion: row.id_notificacion,
    tipo: row.tipo,
    titulo: row.titulo,
    cuerpo: row.cuerpo || null,
    ref_tipo: row.ref_tipo || "solicitud",
    ref_id: row.ref_id,
    payload: parsePayload(row.payload_json),
    leida: Boolean(row.leida_at),
    leida_at: row.leida_at || null,
    created_at: row.created_at,
  };
}

/**
 * Crea notificación para el cliente dueño de la solicitud (id_usuario = id_cliente).
 * Idempotente por (tienda, cliente, tipo, ref_id).
 * No falla el flujo principal si la tabla no existe.
 */
export async function notificarSolicitudCliente(connection, solicitud, tipo, { titulo, cuerpo } = {}) {
  if (!solicitud?.id_usuario || !solicitud?.id_tienda) return null;
  if (!TIPOS_NOTIF.includes(tipo)) return null;

  try {
    const [[dup]] = await connection.query(
      `SELECT id_notificacion FROM ecom_notificacion_cliente
       WHERE id_tienda = ? AND id_cliente = ? AND tipo = ? AND ref_tipo = 'solicitud' AND ref_id = ?
       LIMIT 1`,
      [solicitud.id_tienda, solicitud.id_usuario, tipo, solicitud.id_solicitud]
    );
    if (dup) return dup.id_notificacion;
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") return null;
    throw err;
  }

  const producto = solicitud.producto_nombre || "Producto";
  const codigo = solicitud.codigo || `#${solicitud.id_solicitud}`;
  const defaults = {
    solicitud_aprobada: {
      titulo: `Stock confirmado · ${producto}`,
      cuerpo: `Tu solicitud ${codigo} fue aprobada. Ya puedes comprar.`,
    },
    solicitud_rechazada: {
      titulo: `Sin stock · ${producto}`,
      cuerpo: solicitud.comentario_cliente
        ? String(solicitud.comentario_cliente).slice(0, 500)
        : `Tu solicitud ${codigo} fue rechazada${
            solicitud.motivo_rechazo ? ` (${solicitud.motivo_rechazo})` : ""
          }.`,
    },
    solicitud_expirada: {
      titulo: `Expiró la confirmación · ${producto}`,
      cuerpo: `La autorización de ${codigo} venció. Puedes enviar una nueva solicitud.`,
    },
    solicitud_en_revision: {
      titulo: `En revisión · ${producto}`,
      cuerpo: `Estamos verificando el stock de ${codigo}.`,
    },
    solicitud_cancelada: {
      titulo: `Solicitud cancelada · ${producto}`,
      cuerpo: `La solicitud ${codigo} fue cancelada.`,
    },
  };

  const meta = defaults[tipo] || { titulo: titulo || "Actualización", cuerpo: cuerpo || null };
  const payload = {
    codigo: solicitud.codigo || null,
    estado: tipo.replace("solicitud_", ""),
    id_producto: solicitud.id_producto || null,
    id_variante: solicitud.id_variante || null,
    id_sucursal: solicitud.id_sucursal || null,
    producto_nombre: solicitud.producto_nombre || null,
    expires_at: solicitud.expires_at || null,
    cantidad_aprobada: solicitud.cantidad_aprobada ?? null,
    cantidad_solicitada: solicitud.cantidad_solicitada ?? null,
  };

  try {
    const cuerpoFinal = cuerpo || meta.cuerpo || null;
    const [ins] = await connection.query(
      `INSERT INTO ecom_notificacion_cliente
        (id_tienda, id_cliente, tipo, titulo, cuerpo, ref_tipo, ref_id, payload_json)
       VALUES (?, ?, ?, ?, ?, 'solicitud', ?, ?)`,
      [
        solicitud.id_tienda,
        solicitud.id_usuario,
        tipo,
        (titulo || meta.titulo).slice(0, 160),
        cuerpoFinal ? String(cuerpoFinal).slice(0, 500) : null,
        solicitud.id_solicitud,
        JSON.stringify(payload),
      ]
    );
    return ins.insertId;
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") {
      console.warn("[notif-cliente] tabla ausente, omitiendo insert");
      return null;
    }
    throw err;
  }
}

/**
 * Backfill: solicitudes aprobadas vigentes sin notificación → crea inbox.
 * Así el comprador ve "Stock confirmado" aunque se aprobó antes de existir notifs.
 */
export async function sincronizarNotifsDesdeSolicitudes(connection, id_tienda, id_cliente) {
  try {
    const [rows] = await connection.query(
      `SELECT s.*, p.nombre AS producto_nombre
       FROM ecom_solicitud_disponibilidad s
       LEFT JOIN producto p ON p.id_producto = s.id_producto AND p.id_tienda = s.id_tienda
       WHERE s.id_tienda = ? AND s.id_usuario = ?
         AND s.estado = 'aprobada'
         AND s.expires_at IS NOT NULL AND s.expires_at > NOW()
         AND NOT EXISTS (
           SELECT 1 FROM ecom_notificacion_cliente n
           WHERE n.id_tienda = s.id_tienda
             AND n.id_cliente = s.id_usuario
             AND n.tipo = 'solicitud_aprobada'
             AND n.ref_tipo = 'solicitud'
             AND n.ref_id = s.id_solicitud
         )
       ORDER BY s.respondido_at DESC
       LIMIT 20`,
      [id_tienda, id_cliente]
    );
    for (const s of rows) {
      await notificarSolicitudCliente(connection, s, "solicitud_aprobada");
    }
    return rows.length;
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") return 0;
    throw err;
  }
}

export async function listNotificacionesCliente(
  connection,
  id_tienda,
  id_cliente,
  { limit = 40 } = {}
) {
  await sincronizarNotifsDesdeSolicitudes(connection, id_tienda, id_cliente);
  const [rows] = await connection.query(
    `SELECT * FROM ecom_notificacion_cliente
     WHERE id_tienda = ? AND id_cliente = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [id_tienda, id_cliente, Math.min(80, Math.max(1, Number(limit) || 40))]
  );
  return rows.map(mapNotificacion);
}

export async function countUnreadNotificaciones(connection, id_tienda, id_cliente) {
  await sincronizarNotifsDesdeSolicitudes(connection, id_tienda, id_cliente);
  const [[row]] = await connection.query(
    `SELECT COUNT(*) AS n FROM ecom_notificacion_cliente
     WHERE id_tienda = ? AND id_cliente = ? AND leida_at IS NULL`,
    [id_tienda, id_cliente]
  );
  return Number(row?.n) || 0;
}

export async function marcarNotificacionLeida(connection, id_tienda, id_cliente, id_notificacion) {
  const [r] = await connection.query(
    `UPDATE ecom_notificacion_cliente
     SET leida_at = COALESCE(leida_at, NOW())
     WHERE id_notificacion = ? AND id_tienda = ? AND id_cliente = ?`,
    [id_notificacion, id_tienda, id_cliente]
  );
  return Number(r.affectedRows) > 0;
}

export async function marcarTodasLeidas(connection, id_tienda, id_cliente) {
  const [r] = await connection.query(
    `UPDATE ecom_notificacion_cliente
     SET leida_at = NOW()
     WHERE id_tienda = ? AND id_cliente = ? AND leida_at IS NULL`,
    [id_tienda, id_cliente]
  );
  return Number(r.affectedRows) || 0;
}
