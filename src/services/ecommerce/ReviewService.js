/**
 * Reseñas ecommerce — verificación de compra, agregados, anti-spam.
 * Fase 2: IA, votos, reportes, notificaciones reales.
 */

export function abbreviateNombre(nombre) {
  const parts = String(nombre || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "Cliente";
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
}

export function mapConfig(row) {
  if (!row) return null;
  return {
    activo: Boolean(row.activo),
    allow_producto: Boolean(row.allow_producto),
    allow_sucursal: Boolean(row.allow_sucursal),
    allow_pedido: Boolean(row.allow_pedido),
    allow_general: Boolean(row.allow_general),
    solo_compradores: Boolean(row.solo_compradores),
    moderacion: row.moderacion || "manual",
    allow_imagenes: Boolean(row.allow_imagenes),
    max_imagenes: Number(row.max_imagenes || 5),
    allow_respuestas: Boolean(row.allow_respuestas),
    solicitar_post_entrega: Boolean(row.solicitar_post_entrega),
    dias_espera_solicitud: Number(row.dias_espera_solicitud || 3),
  };
}

export async function getOrCreateReviewConfig(connection, id_tienda) {
  const [[row]] = await connection.query(
    `SELECT * FROM ecom_review_config WHERE id_tienda = ? LIMIT 1`,
    [id_tienda]
  );
  if (row) return row;
  await connection.query(`INSERT INTO ecom_review_config (id_tienda) VALUES (?)`, [id_tienda]);
  const [[created]] = await connection.query(
    `SELECT * FROM ecom_review_config WHERE id_tienda = ? LIMIT 1`,
    [id_tienda]
  );
  return created;
}

/** Compra entregada del producto por este cliente (nunca confiar en el cliente). */
export async function hasVerifiedProductPurchase(connection, {
  id_tienda,
  id_cliente,
  id_producto,
}) {
  const [[row]] = await connection.query(
    `SELECT 1 AS ok
     FROM orden o
     INNER JOIN orden_item oi ON oi.id_orden = o.id_orden AND oi.id_tienda = o.id_tienda
     WHERE o.id_tienda = ?
       AND o.id_cliente = ?
       AND oi.id_producto = ?
       AND o.estado_fulfillment = 'entregado'
     LIMIT 1`,
    [id_tienda, id_cliente, id_producto]
  );
  return Boolean(row);
}

export async function getEntregadoOrdenForCliente(connection, {
  id_tienda,
  id_cliente,
  id_orden,
}) {
  const [[orden]] = await connection.query(
    `SELECT id_orden, id_sucursal, fulfillment, estado_fulfillment, id_cliente
     FROM orden
     WHERE id_orden = ? AND id_tienda = ? AND id_cliente = ? LIMIT 1`,
    [id_orden, id_tienda, id_cliente]
  );
  return orden || null;
}

export async function findExistingReview(connection, {
  id_tienda,
  id_cliente,
  tipo,
  id_producto,
  id_orden,
  id_sucursal,
}) {
  if (tipo === "producto" && id_producto) {
    const [[row]] = await connection.query(
      `SELECT id_review, estado FROM ecom_review
       WHERE id_tienda = ? AND id_cliente = ? AND tipo = 'producto' AND id_producto = ?
         AND estado IN ('pendiente','publicada')
       LIMIT 1`,
      [id_tienda, id_cliente, id_producto]
    );
    return row || null;
  }
  if (tipo === "pedido" && id_orden) {
    const [[row]] = await connection.query(
      `SELECT id_review, estado FROM ecom_review
       WHERE id_tienda = ? AND id_orden = ? AND tipo = 'pedido'
         AND estado IN ('pendiente','publicada')
       LIMIT 1`,
      [id_tienda, id_orden]
    );
    return row || null;
  }
  if (tipo === "sucursal" && id_sucursal) {
    const [[row]] = await connection.query(
      `SELECT id_review, estado FROM ecom_review
       WHERE id_tienda = ? AND id_cliente = ? AND tipo = 'sucursal' AND id_sucursal = ?
         AND estado IN ('pendiente','publicada')
       LIMIT 1`,
      [id_tienda, id_cliente, id_sucursal]
    );
    return row || null;
  }
  return null;
}

export async function checkEligibilidad(connection, {
  id_tienda,
  id_cliente,
  tipo,
  id_producto,
  id_orden,
  id_sucursal,
}) {
  const config = await getOrCreateReviewConfig(connection, id_tienda);
  if (!config.activo) {
    return { puede: false, motivo: "Las reseñas están desactivadas.", compra_verificada: false };
  }

  if (tipo === "producto") {
    if (!config.allow_producto) {
      return { puede: false, motivo: "Reseñas de producto desactivadas.", compra_verificada: false };
    }
    if (!id_producto) {
      return { puede: false, motivo: "Indica el producto.", compra_verificada: false };
    }
    const verified = await hasVerifiedProductPurchase(connection, {
      id_tienda,
      id_cliente,
      id_producto,
    });
    if (config.solo_compradores && !verified) {
      return {
        puede: false,
        motivo: "Solo compradores con pedido entregado pueden reseñar este producto.",
        compra_verificada: false,
      };
    }
    const existing = await findExistingReview(connection, {
      id_tienda,
      id_cliente,
      tipo,
      id_producto,
    });
    if (existing) {
      return {
        puede: false,
        motivo: "Ya dejaste una opinión sobre este producto.",
        compra_verificada: verified,
        id_review: existing.id_review,
      };
    }
    return { puede: true, motivo: null, compra_verificada: verified };
  }

  if (tipo === "pedido") {
    if (!config.allow_pedido) {
      return { puede: false, motivo: "Reseñas de pedido desactivadas.", compra_verificada: false };
    }
    if (!id_orden) {
      return { puede: false, motivo: "Indica el pedido.", compra_verificada: false };
    }
    const orden = await getEntregadoOrdenForCliente(connection, {
      id_tienda,
      id_cliente,
      id_orden,
    });
    if (!orden) {
      return { puede: false, motivo: "Pedido no encontrado.", compra_verificada: false };
    }
    if (orden.estado_fulfillment !== "entregado") {
      return {
        puede: false,
        motivo: "Solo puedes valorar cuando el pedido esté entregado.",
        compra_verificada: false,
      };
    }
    const existing = await findExistingReview(connection, {
      id_tienda,
      id_cliente,
      tipo,
      id_orden,
    });
    if (existing) {
      return {
        puede: false,
        motivo: "Ya valoraste este pedido.",
        compra_verificada: true,
        id_review: existing.id_review,
      };
    }
    return { puede: true, motivo: null, compra_verificada: true };
  }

  if (tipo === "sucursal") {
    if (!config.allow_sucursal) {
      return { puede: false, motivo: "Reseñas de sucursal desactivadas.", compra_verificada: false };
    }
    if (!id_sucursal) {
      return { puede: false, motivo: "Indica la sucursal.", compra_verificada: false };
    }
    const existing = await findExistingReview(connection, {
      id_tienda,
      id_cliente,
      tipo,
      id_sucursal,
    });
    if (existing) {
      return {
        puede: false,
        motivo: "Ya dejaste una opinión sobre esta sucursal.",
        compra_verificada: false,
        id_review: existing.id_review,
      };
    }
    return { puede: true, motivo: null, compra_verificada: false };
  }

  if (tipo === "general") {
    if (!config.allow_general) {
      return { puede: false, motivo: "Opiniones generales desactivadas.", compra_verificada: false };
    }
    return { puede: true, motivo: null, compra_verificada: false };
  }

  return { puede: false, motivo: "Tipo de reseña inválido.", compra_verificada: false };
}

export function parseJsonMaybe(v) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export function mapReviewPublic(row, media = [], reply = null) {
  return {
    id_review: row.id_review,
    tipo: row.tipo,
    rating: Number(row.rating),
    titulo: row.titulo,
    comentario: row.comentario,
    tema_general: row.tema_general,
    ratings_json: parseJsonMaybe(row.ratings_json),
    compra_verificada: Boolean(row.compra_verificada),
    nombre_publico: row.nombre_publico,
    id_producto: row.id_producto,
    id_variante: row.id_variante,
    id_orden: row.id_orden,
    id_sucursal: row.id_sucursal,
    producto_nombre: row.producto_nombre || null,
    created_at: row.created_at,
    media: media.map((m) => ({
      id_media: m.id_media,
      url: m.url,
      orden: m.orden,
      tipo: m.tipo,
    })),
    reply: reply
      ? {
          cuerpo: reply.cuerpo,
          created_at: reply.created_at,
        }
      : null,
  };
}

export async function loadMediaForReviews(connection, id_tienda, reviewIds) {
  if (!reviewIds.length) return new Map();
  const [rows] = await connection.query(
    `SELECT id_media, id_review, url, file_id, orden, tipo
     FROM ecom_review_media
     WHERE id_tienda = ? AND id_review IN (?)
     ORDER BY orden ASC, id_media ASC`,
    [id_tienda, reviewIds]
  );
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.id_review)) map.set(r.id_review, []);
    map.get(r.id_review).push(r);
  }
  return map;
}

export async function loadRepliesForReviews(connection, id_tienda, reviewIds) {
  if (!reviewIds.length) return new Map();
  const [rows] = await connection.query(
    `SELECT id_reply, id_review, cuerpo, created_at
     FROM ecom_review_reply
     WHERE id_tienda = ? AND id_review IN (?)`,
    [id_tienda, reviewIds]
  );
  const map = new Map();
  for (const r of rows) map.set(r.id_review, r);
  return map;
}

export async function aggregateRatings(connection, {
  id_tienda,
  tipo,
  id_producto = null,
  id_sucursal = null,
}) {
  let sql = `
    SELECT
      COUNT(*) AS total,
      AVG(rating) AS promedio,
      SUM(rating = 5) AS r5,
      SUM(rating = 4) AS r4,
      SUM(rating = 3) AS r3,
      SUM(rating = 2) AS r2,
      SUM(rating = 1) AS r1
    FROM ecom_review
    WHERE id_tienda = ? AND tipo = ? AND estado = 'publicada'`;
  const params = [id_tienda, tipo];
  if (tipo === "producto" && id_producto) {
    sql += ` AND id_producto = ?`;
    params.push(id_producto);
  }
  if (tipo === "sucursal" && id_sucursal) {
    sql += ` AND id_sucursal = ?`;
    params.push(id_sucursal);
  }
  const [[row]] = await connection.query(sql, params);
  const total = Number(row?.total || 0);
  return {
    total,
    promedio: total ? Math.round(Number(row.promedio) * 10) / 10 : 0,
    histograma: {
      5: Number(row?.r5 || 0),
      4: Number(row?.r4 || 0),
      3: Number(row?.r3 || 0),
      2: Number(row?.r2 || 0),
      1: Number(row?.r1 || 0),
    },
  };
}

/**
 * Stub fase 2: solicitud automática de reseña post-entrega (email/WhatsApp/push).
 * Hoy no-op; no llamar servicios externos.
 */
export function scheduleReviewInvite(_orden) {
  // Fase 2: cola / cron según ecom_review_config.dias_espera_solicitud
}
