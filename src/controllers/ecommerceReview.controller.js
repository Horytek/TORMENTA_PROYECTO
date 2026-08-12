import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { uploadImage as subirAImageKit } from "../services/imagekit.service.js";
import {
  abbreviateNombre,
  aggregateRatings,
  checkEligibilidad,
  getOrCreateReviewConfig,
  loadMediaForReviews,
  loadRepliesForReviews,
  mapConfig,
  mapReviewPublic,
  scheduleReviewInvite,
} from "../services/ecommerce/ReviewService.js";

async function resolveTiendaBySlug(connection, slug) {
  const [[tienda]] = await connection.query(
    `SELECT id_tienda, slug, estado, nombre FROM tienda WHERE slug = ? LIMIT 1`,
    [slug]
  );
  return tienda;
}

function sortClause(sort) {
  switch (sort) {
    case "mejor":
      return "r.rating DESC, r.created_at DESC";
    case "peor":
      return "r.rating ASC, r.created_at DESC";
    case "fotos":
      return "(SELECT COUNT(*) FROM ecom_review_media m WHERE m.id_review = r.id_review) DESC, r.created_at DESC";
    case "verificadas":
      return "r.compra_verificada DESC, r.created_at DESC";
    case "recientes":
    default:
      return "r.created_at DESC";
  }
}

// ——— Config admin ———

export const getReviewConfig = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const row = await getOrCreateReviewConfig(connection, req.id_tienda);
    return res.json({ success: true, data: mapConfig(row) });
  } catch (error) {
    console.error("[reviews.getConfig]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const patchReviewConfig = async (req, res) => {
  const body = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    await getOrCreateReviewConfig(connection, req.id_tienda);
    const fields = [
      "activo",
      "allow_producto",
      "allow_sucursal",
      "allow_pedido",
      "allow_general",
      "solo_compradores",
      "moderacion",
      "allow_imagenes",
      "max_imagenes",
      "allow_respuestas",
      "solicitar_post_entrega",
      "dias_espera_solicitud",
    ];
    const sets = [];
    const params = [];
    for (const f of fields) {
      if (body[f] === undefined) continue;
      let val = body[f];
      if (
        [
          "activo",
          "allow_producto",
          "allow_sucursal",
          "allow_pedido",
          "allow_general",
          "solo_compradores",
          "allow_imagenes",
          "allow_respuestas",
          "solicitar_post_entrega",
        ].includes(f)
      ) {
        val = val ? 1 : 0;
      }
      sets.push(`${f} = ?`);
      params.push(val);
    }
    if (sets.length) {
      params.push(req.id_tienda);
      await connection.query(
        `UPDATE ecom_review_config SET ${sets.join(", ")} WHERE id_tienda = ?`,
        params
      );
    }
    const row = await getOrCreateReviewConfig(connection, req.id_tienda);
    return res.json({ success: true, data: mapConfig(row) });
  } catch (error) {
    console.error("[reviews.patchConfig]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

// ——— Storefront ———

export const getReviewEligibilidad = async (req, res) => {
  const { slug } = req.params;
  const tipo = String(req.query.tipo || "");
  const id_producto = req.query.id_producto ? Number(req.query.id_producto) : null;
  const id_orden = req.query.id_orden ? Number(req.query.id_orden) : null;
  const id_sucursal = req.query.id_sucursal ? Number(req.query.id_sucursal) : null;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const tienda = await resolveTiendaBySlug(connection, slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    if (Number(tienda.id_tienda) !== Number(req.id_tienda)) {
      return res.status(403).json({ success: false, message: "Tienda incorrecta." });
    }
    const data = await checkEligibilidad(connection, {
      id_tienda: tienda.id_tienda,
      id_cliente: req.id_cliente,
      tipo,
      id_producto,
      id_orden,
      id_sucursal,
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("[reviews.eligibilidad]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const getProductReviews = async (req, res) => {
  const { slug, id } = req.params;
  const id_producto = Number(id);
  const sort = String(req.query.sort || "recientes");
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const tienda = await resolveTiendaBySlug(connection, slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const summary = await aggregateRatings(connection, {
      id_tienda: tienda.id_tienda,
      tipo: "producto",
      id_producto,
    });
    const [rows] = await connection.query(
      `SELECT r.*, p.nombre AS producto_nombre
       FROM ecom_review r
       LEFT JOIN producto p ON p.id_producto = r.id_producto
       WHERE r.id_tienda = ? AND r.tipo = 'producto' AND r.id_producto = ?
         AND r.estado = 'publicada'
       ORDER BY ${sortClause(sort)}
       LIMIT ? OFFSET ?`,
      [tienda.id_tienda, id_producto, limit, offset]
    );
    const ids = rows.map((r) => r.id_review);
    const mediaMap = await loadMediaForReviews(connection, tienda.id_tienda, ids);
    const replyMap = await loadRepliesForReviews(connection, tienda.id_tienda, ids);
    return res.json({
      success: true,
      data: {
        summary,
        reviews: rows.map((r) =>
          mapReviewPublic(r, mediaMap.get(r.id_review) || [], replyMap.get(r.id_review) || null)
        ),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("[reviews.product]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const getReviewSummary = async (req, res) => {
  const { slug } = req.params;
  const tipo = String(req.query.tipo || "producto");
  const id_producto = req.query.id_producto ? Number(req.query.id_producto) : null;
  const id_sucursal = req.query.id_sucursal ? Number(req.query.id_sucursal) : null;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const tienda = await resolveTiendaBySlug(connection, slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const summary = await aggregateRatings(connection, {
      id_tienda: tienda.id_tienda,
      tipo,
      id_producto,
      id_sucursal,
    });
    return res.json({ success: true, data: summary });
  } catch (error) {
    console.error("[reviews.summary]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const getSucursalReviews = async (req, res) => {
  const { slug, id } = req.params;
  const id_sucursal = Number(id);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  let connection;
  try {
    connection = await getEcommerceConnection();
    const tienda = await resolveTiendaBySlug(connection, slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const config = await getOrCreateReviewConfig(connection, tienda.id_tienda);
    if (!config.allow_sucursal) {
      return res.json({ success: true, data: { summary: { total: 0, promedio: 0, histograma: {} }, reviews: [] } });
    }
    const summary = await aggregateRatings(connection, {
      id_tienda: tienda.id_tienda,
      tipo: "sucursal",
      id_sucursal,
    });
    const [rows] = await connection.query(
      `SELECT r.* FROM ecom_review r
       WHERE r.id_tienda = ? AND r.tipo = 'sucursal' AND r.id_sucursal = ?
         AND r.estado = 'publicada'
       ORDER BY r.created_at DESC LIMIT ?`,
      [tienda.id_tienda, id_sucursal, limit]
    );
    const ids = rows.map((r) => r.id_review);
    const mediaMap = await loadMediaForReviews(connection, tienda.id_tienda, ids);
    const replyMap = await loadRepliesForReviews(connection, tienda.id_tienda, ids);
    return res.json({
      success: true,
      data: {
        summary,
        reviews: rows.map((r) =>
          mapReviewPublic(r, mediaMap.get(r.id_review) || [], replyMap.get(r.id_review) || null)
        ),
      },
    });
  } catch (error) {
    console.error("[reviews.sucursal]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const getOpinionesGenerales = async (req, res) => {
  const { slug } = req.params;
  const limit = Math.min(50, Number(req.query.limit) || 20);
  let connection;
  try {
    connection = await getEcommerceConnection();
    const tienda = await resolveTiendaBySlug(connection, slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const [rows] = await connection.query(
      `SELECT r.* FROM ecom_review r
       WHERE r.id_tienda = ? AND r.tipo = 'general' AND r.estado = 'publicada'
       ORDER BY r.created_at DESC LIMIT ?`,
      [tienda.id_tienda, limit]
    );
    const ids = rows.map((r) => r.id_review);
    const mediaMap = await loadMediaForReviews(connection, tienda.id_tienda, ids);
    const replyMap = await loadRepliesForReviews(connection, tienda.id_tienda, ids);
    return res.json({
      success: true,
      data: {
        reviews: rows.map((r) =>
          mapReviewPublic(r, mediaMap.get(r.id_review) || [], replyMap.get(r.id_review) || null)
        ),
      },
    });
  } catch (error) {
    console.error("[reviews.opiniones]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const createReview = async (req, res) => {
  const { slug } = req.params;
  const body = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const tienda = await resolveTiendaBySlug(connection, slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    if (Number(tienda.id_tienda) !== Number(req.id_tienda)) {
      return res.status(403).json({ success: false, message: "Tienda incorrecta." });
    }

    const tipo = body.tipo;
    const elig = await checkEligibilidad(connection, {
      id_tienda: tienda.id_tienda,
      id_cliente: req.id_cliente,
      tipo,
      id_producto: body.id_producto || null,
      id_orden: body.id_orden || null,
      id_sucursal: body.id_sucursal || null,
    });
    if (!elig.puede) {
      return res.status(403).json({ success: false, message: elig.motivo || "No puedes reseñar." });
    }

    const config = await getOrCreateReviewConfig(connection, tienda.id_tienda);
    const estado = config.moderacion === "auto" ? "publicada" : "pendiente";
    const nombre_publico = abbreviateNombre(req.storefrontUser?.nombre || "Cliente");
    const mediaUrls = Array.isArray(body.media) ? body.media.slice(0, config.max_imagenes || 5) : [];

    if (mediaUrls.length && !config.allow_imagenes) {
      return res.status(400).json({ success: false, message: "Las imágenes no están permitidas." });
    }

    let id_sucursal = body.id_sucursal || null;
    if (tipo === "pedido" && body.id_orden) {
      const [[orden]] = await connection.query(
        `SELECT id_sucursal FROM orden WHERE id_orden = ? AND id_tienda = ? LIMIT 1`,
        [body.id_orden, tienda.id_tienda]
      );
      id_sucursal = orden?.id_sucursal || id_sucursal;
    }

    const [ins] = await connection.query(
      `INSERT INTO ecom_review
        (id_tienda, id_cliente, tipo, id_producto, id_variante, id_orden, id_sucursal,
         rating, titulo, comentario, tema_general, ratings_json, compra_verificada, estado, nombre_publico)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tienda.id_tienda,
        req.id_cliente,
        tipo,
        body.id_producto || null,
        body.id_variante || null,
        body.id_orden || null,
        id_sucursal,
        body.rating,
        body.titulo || null,
        body.comentario || null,
        body.tema_general || null,
        body.ratings_json ? JSON.stringify(body.ratings_json) : null,
        elig.compra_verificada ? 1 : 0,
        estado,
        nombre_publico,
      ]
    );
    const id_review = ins.insertId;

    let orden = 0;
    for (const m of mediaUrls) {
      if (!m?.url) continue;
      await connection.query(
        `INSERT INTO ecom_review_media (id_review, id_tienda, url, file_id, orden, tipo)
         VALUES (?, ?, ?, ?, ?, 'image')`,
        [id_review, tienda.id_tienda, m.url, m.file_id || null, orden++]
      );
    }

    const [[row]] = await connection.query(
      `SELECT * FROM ecom_review WHERE id_review = ? AND id_tienda = ?`,
      [id_review, tienda.id_tienda]
    );
    const mediaMap = await loadMediaForReviews(connection, tienda.id_tienda, [id_review]);

    return res.status(201).json({
      success: true,
      data: mapReviewPublic(row, mediaMap.get(id_review) || [], null),
    });
  } catch (error) {
    console.error("[reviews.create]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const uploadReviewMedia = async (req, res) => {
  const { slug } = req.params;
  const { data_base64, file_name } = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const tienda = await resolveTiendaBySlug(connection, slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    if (Number(tienda.id_tienda) !== Number(req.id_tienda)) {
      return res.status(403).json({ success: false, message: "Tienda incorrecta." });
    }
    const config = await getOrCreateReviewConfig(connection, tienda.id_tienda);
    if (!config.allow_imagenes) {
      return res.status(400).json({ success: false, message: "Las imágenes no están permitidas." });
    }
    if (!data_base64) {
      return res.status(400).json({ success: false, message: "Falta la imagen." });
    }

    connection.release();
    connection = null;

    const uploaded = await subirAImageKit({
      file: data_base64,
      fileName: file_name || `review-${Date.now()}.jpg`,
      folder: `/ecommerce/${tienda.id_tienda}/reviews/`,
    });

    return res.json({
      success: true,
      data: { url: uploaded.url, file_id: uploaded.fileId },
    });
  } catch (error) {
    console.error("[reviews.uploadMedia]", error);
    return res.status(500).json({ success: false, message: "Error al subir imagen." });
  } finally {
    if (connection) connection.release();
  }
};

export const listMisReviews = async (req, res) => {
  const { slug } = req.params;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const tienda = await resolveTiendaBySlug(connection, slug);
    if (!tienda) {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    if (Number(tienda.id_tienda) !== Number(req.id_tienda)) {
      return res.status(403).json({ success: false, message: "Tienda incorrecta." });
    }
    const [rows] = await connection.query(
      `SELECT r.*, p.nombre AS producto_nombre
       FROM ecom_review r
       LEFT JOIN producto p ON p.id_producto = r.id_producto
       WHERE r.id_tienda = ? AND r.id_cliente = ?
       ORDER BY r.created_at DESC`,
      [tienda.id_tienda, req.id_cliente]
    );
    const ids = rows.map((r) => r.id_review);
    const mediaMap = await loadMediaForReviews(connection, tienda.id_tienda, ids);
    const replyMap = await loadRepliesForReviews(connection, tienda.id_tienda, ids);
    return res.json({
      success: true,
      data: rows.map((r) => ({
        ...mapReviewPublic(r, mediaMap.get(r.id_review) || [], replyMap.get(r.id_review) || null),
        estado: r.estado,
      })),
    });
  } catch (error) {
    console.error("[reviews.mis]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

// ——— Admin ———

export const adminListReviews = async (req, res) => {
  const {
    tipo,
    estado,
    q,
    rating,
    page = 1,
    limit = 30,
  } = req.query;
  let connection;
  try {
    connection = await getEcommerceConnection();
    let sql = `
      SELECT r.*, p.nombre AS producto_nombre, c.email AS cliente_email, c.nombre AS cliente_nombre
      FROM ecom_review r
      LEFT JOIN producto p ON p.id_producto = r.id_producto
      LEFT JOIN ecom_cliente c ON c.id_cliente = r.id_cliente
      WHERE r.id_tienda = ?`;
    const params = [req.id_tienda];
    if (tipo) {
      sql += ` AND r.tipo = ?`;
      params.push(String(tipo));
    }
    if (estado) {
      sql += ` AND r.estado = ?`;
      params.push(String(estado));
    }
    if (rating) {
      sql += ` AND r.rating = ?`;
      params.push(Number(rating));
    }
    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      sql += ` AND (r.comentario LIKE ? OR r.titulo LIKE ? OR c.nombre LIKE ? OR c.email LIKE ? OR p.nombre LIKE ?)`;
      params.push(term, term, term, term, term);
    }
    const lim = Math.min(100, Number(limit) || 30);
    const offset = (Math.max(1, Number(page)) - 1) * lim;
    sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(lim, offset);

    const [rows] = await connection.query(sql, params);
    const ids = rows.map((r) => r.id_review);
    const mediaMap = await loadMediaForReviews(connection, req.id_tienda, ids);
    const replyMap = await loadRepliesForReviews(connection, req.id_tienda, ids);

    return res.json({
      success: true,
      data: rows.map((r) => ({
        ...mapReviewPublic(r, mediaMap.get(r.id_review) || [], replyMap.get(r.id_review) || null),
        estado: r.estado,
        cliente_nombre: r.cliente_nombre,
        cliente_email: r.cliente_email,
      })),
    });
  } catch (error) {
    console.error("[reviews.adminList]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminReviewStats = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[tot]] = await connection.query(
      `SELECT
         COUNT(*) AS total,
         AVG(CASE WHEN estado = 'publicada' THEN rating END) AS promedio,
         SUM(estado = 'pendiente') AS pendientes,
         SUM(estado = 'publicada') AS publicadas,
         SUM(estado = 'ocultada') AS ocultadas,
         SUM(estado = 'rechazada') AS rechazadas
       FROM ecom_review WHERE id_tienda = ?`,
      [req.id_tienda]
    );

    const [top] = await connection.query(
      `SELECT r.id_producto, p.nombre, AVG(r.rating) AS promedio, COUNT(*) AS n
       FROM ecom_review r
       JOIN producto p ON p.id_producto = r.id_producto
       WHERE r.id_tienda = ? AND r.tipo = 'producto' AND r.estado = 'publicada' AND r.id_producto IS NOT NULL
       GROUP BY r.id_producto, p.nombre
       HAVING n >= 1
       ORDER BY promedio DESC, n DESC
       LIMIT 5`,
      [req.id_tienda]
    );
    const [bottom] = await connection.query(
      `SELECT r.id_producto, p.nombre, AVG(r.rating) AS promedio, COUNT(*) AS n
       FROM ecom_review r
       JOIN producto p ON p.id_producto = r.id_producto
       WHERE r.id_tienda = ? AND r.tipo = 'producto' AND r.estado = 'publicada' AND r.id_producto IS NOT NULL
       GROUP BY r.id_producto, p.nombre
       HAVING n >= 1
       ORDER BY promedio ASC, n DESC
       LIMIT 5`,
      [req.id_tienda]
    );

    return res.json({
      success: true,
      data: {
        total: Number(tot?.total || 0),
        promedio: tot?.promedio != null ? Math.round(Number(tot.promedio) * 10) / 10 : 0,
        pendientes: Number(tot?.pendientes || 0),
        publicadas: Number(tot?.publicadas || 0),
        ocultadas: Number(tot?.ocultadas || 0),
        rechazadas: Number(tot?.rechazadas || 0),
        top_productos: top.map((t) => ({
          id_producto: t.id_producto,
          nombre: t.nombre,
          promedio: Math.round(Number(t.promedio) * 10) / 10,
          n: Number(t.n),
        })),
        bottom_productos: bottom.map((t) => ({
          id_producto: t.id_producto,
          nombre: t.nombre,
          promedio: Math.round(Number(t.promedio) * 10) / 10,
          n: Number(t.n),
        })),
      },
    });
  } catch (error) {
    console.error("[reviews.stats]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminPatchReviewEstado = async (req, res) => {
  const id_review = Number(req.params.id);
  const { estado } = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [r] = await connection.query(
      `UPDATE ecom_review SET estado = ? WHERE id_review = ? AND id_tienda = ?`,
      [estado, id_review, req.id_tienda]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Reseña no encontrada." });
    }
    return res.json({ success: true, data: { id_review, estado } });
  } catch (error) {
    console.error("[reviews.patchEstado]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const adminReplyReview = async (req, res) => {
  const id_review = Number(req.params.id);
  const { cuerpo } = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const config = await getOrCreateReviewConfig(connection, req.id_tienda);
    if (!config.allow_respuestas) {
      return res.status(400).json({ success: false, message: "Las respuestas están desactivadas." });
    }
    const [[rev]] = await connection.query(
      `SELECT id_review FROM ecom_review WHERE id_review = ? AND id_tienda = ? LIMIT 1`,
      [id_review, req.id_tienda]
    );
    if (!rev) {
      return res.status(404).json({ success: false, message: "Reseña no encontrada." });
    }
    const id_usuario = req.ecommerceUser?.id_usuario || null;
    await connection.query(
      `INSERT INTO ecom_review_reply (id_review, id_tienda, id_usuario, cuerpo)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE cuerpo = VALUES(cuerpo), id_usuario = VALUES(id_usuario)`,
      [id_review, req.id_tienda, id_usuario, cuerpo]
    );
    // Fase 2: notificar al comprador (email / WhatsApp / push)
    return res.json({ success: true, data: { id_review, cuerpo } });
  } catch (error) {
    console.error("[reviews.reply]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export { scheduleReviewInvite };
