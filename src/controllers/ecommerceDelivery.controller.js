import { getEcommerceConnection } from "../database/database_ecommerce.js";
import {
  cotizarEntrega,
  getOrCreateEntregaConfig,
  listOpcionesEntrega,
  mapConfigPublic,
  validateGeoJsonPolygon,
} from "../services/ecommerce/DeliveryQuoteService.js";

function parseJsonMaybe(v) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function mapZona(row) {
  return {
    id_zona: row.id_zona,
    id_tienda: row.id_tienda,
    id_sucursal: row.id_sucursal,
    sucursal_nombre: row.sucursal_nombre || null,
    nombre: row.nombre,
    costo: Number(row.costo),
    tiempo_estimado: row.tiempo_estimado,
    pedido_min: row.pedido_min != null ? Number(row.pedido_min) : null,
    activo: Boolean(row.activo),
    orden: row.orden,
    geojson: parseJsonMaybe(row.geojson),
    distritos_json: parseJsonMaybe(row.distritos_json),
    observaciones: row.observaciones,
  };
}

function mapDestino(row) {
  return {
    id_destino: row.id_destino,
    departamento: row.departamento,
    provincia: row.provincia,
    costo: Number(row.costo),
    tiempo_estimado: row.tiempo_estimado,
    activo: Boolean(row.activo),
  };
}

function mapAgencia(row) {
  return {
    id_agencia: row.id_agencia,
    nombre: row.nombre,
    telefono: row.telefono,
    direccion: row.direccion,
    cobertura_texto: row.cobertura_texto,
    observaciones: row.observaciones,
    activo: Boolean(row.activo),
  };
}

// ——— Admin config ———

export const getEntregaConfig = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const row = await getOrCreateEntregaConfig(connection, req.id_tienda);
    return res.json({ success: true, data: mapConfigPublic(row) });
  } catch (error) {
    console.error("[entregas.getConfig]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const patchEntregaConfig = async (req, res) => {
  const body = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    await getOrCreateEntregaConfig(connection, req.id_tienda);

    const fields = [
      "retiro_activo",
      "delivery_activo",
      "provincia_activo",
      "retiro_prep_minutos",
      "retiro_instrucciones",
      "delivery_modelo",
      "delivery_costo_base",
      "delivery_recargo",
      "delivery_pedido_min",
      "delivery_gratis_desde",
      "delivery_tiempo_texto",
      "provincia_pedido_min",
      "provincia_condiciones",
      "provincia_requiere_agencia",
    ];

    const sets = [];
    const params = [];
    for (const f of fields) {
      if (body[f] === undefined) continue;
      let val = body[f];
      if (
        [
          "retiro_activo",
          "delivery_activo",
          "provincia_activo",
          "provincia_requiere_agencia",
        ].includes(f)
      ) {
        val = val ? 1 : 0;
      }
      sets.push(`${f} = ?`);
      params.push(val);
    }
    if (!sets.length) {
      const row = await getOrCreateEntregaConfig(connection, req.id_tienda);
      return res.json({ success: true, data: mapConfigPublic(row) });
    }
    params.push(req.id_tienda);
    await connection.query(
      `UPDATE ecom_entrega_config SET ${sets.join(", ")} WHERE id_tienda = ?`,
      params
    );
    const row = await getOrCreateEntregaConfig(connection, req.id_tienda);
    return res.json({ success: true, data: mapConfigPublic(row) });
  } catch (error) {
    console.error("[entregas.patchConfig]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

// ——— Zonas ———

export const listZonas = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [rows] = await connection.query(
      `SELECT z.*, s.nombre AS sucursal_nombre
       FROM ecom_delivery_zona z
       LEFT JOIN ecom_sucursal s ON s.id_sucursal = z.id_sucursal
       WHERE z.id_tienda = ?
       ORDER BY z.orden ASC, z.id_zona ASC`,
      [req.id_tienda]
    );
    return res.json({ success: true, data: rows.map(mapZona) });
  } catch (error) {
    console.error("[entregas.listZonas]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const createZona = async (req, res) => {
  const body = req.body;
  let connection;
  try {
    const geoCheck = validateGeoJsonPolygon(body.geojson);
    if (!geoCheck.ok) {
      return res.status(400).json({ success: false, message: geoCheck.message });
    }
    connection = await getEcommerceConnection();
    const [[suc]] = await connection.query(
      `SELECT id_sucursal FROM ecom_sucursal
       WHERE id_sucursal = ? AND id_tienda = ? AND activo = 1 LIMIT 1`,
      [body.id_sucursal, req.id_tienda]
    );
    if (!suc) {
      return res.status(400).json({ success: false, message: "Sucursal inválida." });
    }
    const [ins] = await connection.query(
      `INSERT INTO ecom_delivery_zona
        (id_tienda, id_sucursal, nombre, costo, tiempo_estimado, pedido_min, activo, orden, geojson, distritos_json, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.id_tienda,
        body.id_sucursal,
        body.nombre,
        body.costo ?? 0,
        body.tiempo_estimado || null,
        body.pedido_min ?? null,
        body.activo === false ? 0 : 1,
        body.orden ?? 0,
        JSON.stringify(geoCheck.geometry),
        body.distritos_json ? JSON.stringify(body.distritos_json) : null,
        body.observaciones || null,
      ]
    );
    const [[row]] = await connection.query(
      `SELECT z.*, s.nombre AS sucursal_nombre FROM ecom_delivery_zona z
       LEFT JOIN ecom_sucursal s ON s.id_sucursal = z.id_sucursal
       WHERE z.id_zona = ? AND z.id_tienda = ?`,
      [ins.insertId, req.id_tienda]
    );
    return res.status(201).json({ success: true, data: mapZona(row) });
  } catch (error) {
    console.error("[entregas.createZona]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const updateZona = async (req, res) => {
  const id_zona = Number(req.params.id);
  const body = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[exist]] = await connection.query(
      `SELECT id_zona FROM ecom_delivery_zona WHERE id_zona = ? AND id_tienda = ? LIMIT 1`,
      [id_zona, req.id_tienda]
    );
    if (!exist) {
      return res.status(404).json({ success: false, message: "Zona no encontrada." });
    }

    let geoJsonStr = undefined;
    if (body.geojson !== undefined) {
      const geoCheck = validateGeoJsonPolygon(body.geojson);
      if (!geoCheck.ok) {
        return res.status(400).json({ success: false, message: geoCheck.message });
      }
      geoJsonStr = JSON.stringify(geoCheck.geometry);
    }

    if (body.id_sucursal) {
      const [[suc]] = await connection.query(
        `SELECT id_sucursal FROM ecom_sucursal
         WHERE id_sucursal = ? AND id_tienda = ? AND activo = 1 LIMIT 1`,
        [body.id_sucursal, req.id_tienda]
      );
      if (!suc) {
        return res.status(400).json({ success: false, message: "Sucursal inválida." });
      }
    }

    await connection.query(
      `UPDATE ecom_delivery_zona SET
         id_sucursal = COALESCE(?, id_sucursal),
         nombre = COALESCE(?, nombre),
         costo = COALESCE(?, costo),
         tiempo_estimado = COALESCE(?, tiempo_estimado),
         pedido_min = IF(? IS NULL AND ? = 1, NULL, COALESCE(?, pedido_min)),
         activo = COALESCE(?, activo),
         orden = COALESCE(?, orden),
         geojson = COALESCE(?, geojson),
         distritos_json = COALESCE(?, distritos_json),
         observaciones = COALESCE(?, observaciones)
       WHERE id_zona = ? AND id_tienda = ?`,
      [
        body.id_sucursal ?? null,
        body.nombre ?? null,
        body.costo ?? null,
        body.tiempo_estimado !== undefined ? body.tiempo_estimado : null,
        body.pedido_min,
        body.pedido_min === null ? 1 : 0,
        body.pedido_min ?? null,
        body.activo !== undefined ? (body.activo ? 1 : 0) : null,
        body.orden ?? null,
        geoJsonStr ?? null,
        body.distritos_json !== undefined
          ? JSON.stringify(body.distritos_json)
          : null,
        body.observaciones !== undefined ? body.observaciones : null,
        id_zona,
        req.id_tienda,
      ]
    );

    const [[row]] = await connection.query(
      `SELECT z.*, s.nombre AS sucursal_nombre FROM ecom_delivery_zona z
       LEFT JOIN ecom_sucursal s ON s.id_sucursal = z.id_sucursal
       WHERE z.id_zona = ? AND z.id_tienda = ?`,
      [id_zona, req.id_tienda]
    );
    return res.json({ success: true, data: mapZona(row) });
  } catch (error) {
    console.error("[entregas.updateZona]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const deleteZona = async (req, res) => {
  const id_zona = Number(req.params.id);
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [r] = await connection.query(
      `UPDATE ecom_delivery_zona SET activo = 0 WHERE id_zona = ? AND id_tienda = ?`,
      [id_zona, req.id_tienda]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Zona no encontrada." });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("[entregas.deleteZona]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

// ——— Destinos provincia ———

export const listDestinos = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [rows] = await connection.query(
      `SELECT * FROM ecom_envio_destino WHERE id_tienda = ? ORDER BY departamento, provincia`,
      [req.id_tienda]
    );
    return res.json({ success: true, data: rows.map(mapDestino) });
  } catch (error) {
    console.error("[entregas.listDestinos]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const createDestino = async (req, res) => {
  const body = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [ins] = await connection.query(
      `INSERT INTO ecom_envio_destino
        (id_tienda, departamento, provincia, costo, tiempo_estimado, activo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.id_tienda,
        body.departamento,
        body.provincia || null,
        body.costo ?? 0,
        body.tiempo_estimado || null,
        body.activo === false ? 0 : 1,
      ]
    );
    const [[row]] = await connection.query(
      `SELECT * FROM ecom_envio_destino WHERE id_destino = ? AND id_tienda = ?`,
      [ins.insertId, req.id_tienda]
    );
    return res.status(201).json({ success: true, data: mapDestino(row) });
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "Destino duplicado." });
    }
    console.error("[entregas.createDestino]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const updateDestino = async (req, res) => {
  const id_destino = Number(req.params.id);
  const body = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [r] = await connection.query(
      `UPDATE ecom_envio_destino SET
         departamento = COALESCE(?, departamento),
         provincia = COALESCE(?, provincia),
         costo = COALESCE(?, costo),
         tiempo_estimado = COALESCE(?, tiempo_estimado),
         activo = COALESCE(?, activo)
       WHERE id_destino = ? AND id_tienda = ?`,
      [
        body.departamento ?? null,
        body.provincia !== undefined ? body.provincia : null,
        body.costo ?? null,
        body.tiempo_estimado !== undefined ? body.tiempo_estimado : null,
        body.activo !== undefined ? (body.activo ? 1 : 0) : null,
        id_destino,
        req.id_tienda,
      ]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Destino no encontrado." });
    }
    const [[row]] = await connection.query(
      `SELECT * FROM ecom_envio_destino WHERE id_destino = ? AND id_tienda = ?`,
      [id_destino, req.id_tienda]
    );
    return res.json({ success: true, data: mapDestino(row) });
  } catch (error) {
    console.error("[entregas.updateDestino]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const deleteDestino = async (req, res) => {
  const id_destino = Number(req.params.id);
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [r] = await connection.query(
      `UPDATE ecom_envio_destino SET activo = 0 WHERE id_destino = ? AND id_tienda = ?`,
      [id_destino, req.id_tienda]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Destino no encontrado." });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("[entregas.deleteDestino]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

// ——— Agencias ———

export const listAgencias = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [rows] = await connection.query(
      `SELECT * FROM ecom_envio_agencia WHERE id_tienda = ? ORDER BY nombre`,
      [req.id_tienda]
    );
    return res.json({ success: true, data: rows.map(mapAgencia) });
  } catch (error) {
    console.error("[entregas.listAgencias]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const createAgencia = async (req, res) => {
  const body = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [ins] = await connection.query(
      `INSERT INTO ecom_envio_agencia
        (id_tienda, nombre, telefono, direccion, cobertura_texto, observaciones, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.id_tienda,
        body.nombre,
        body.telefono || null,
        body.direccion || null,
        body.cobertura_texto || null,
        body.observaciones || null,
        body.activo === false ? 0 : 1,
      ]
    );
    const [[row]] = await connection.query(
      `SELECT * FROM ecom_envio_agencia WHERE id_agencia = ? AND id_tienda = ?`,
      [ins.insertId, req.id_tienda]
    );
    return res.status(201).json({ success: true, data: mapAgencia(row) });
  } catch (error) {
    console.error("[entregas.createAgencia]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const updateAgencia = async (req, res) => {
  const id_agencia = Number(req.params.id);
  const body = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [r] = await connection.query(
      `UPDATE ecom_envio_agencia SET
         nombre = COALESCE(?, nombre),
         telefono = COALESCE(?, telefono),
         direccion = COALESCE(?, direccion),
         cobertura_texto = COALESCE(?, cobertura_texto),
         observaciones = COALESCE(?, observaciones),
         activo = COALESCE(?, activo)
       WHERE id_agencia = ? AND id_tienda = ?`,
      [
        body.nombre ?? null,
        body.telefono !== undefined ? body.telefono : null,
        body.direccion !== undefined ? body.direccion : null,
        body.cobertura_texto !== undefined ? body.cobertura_texto : null,
        body.observaciones !== undefined ? body.observaciones : null,
        body.activo !== undefined ? (body.activo ? 1 : 0) : null,
        id_agencia,
        req.id_tienda,
      ]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Agencia no encontrada." });
    }
    const [[row]] = await connection.query(
      `SELECT * FROM ecom_envio_agencia WHERE id_agencia = ? AND id_tienda = ?`,
      [id_agencia, req.id_tienda]
    );
    return res.json({ success: true, data: mapAgencia(row) });
  } catch (error) {
    console.error("[entregas.updateAgencia]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const deleteAgencia = async (req, res) => {
  const id_agencia = Number(req.params.id);
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [r] = await connection.query(
      `UPDATE ecom_envio_agencia SET activo = 0 WHERE id_agencia = ? AND id_tienda = ?`,
      [id_agencia, req.id_tienda]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ success: false, message: "Agencia no encontrada." });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("[entregas.deleteAgencia]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

// ——— Storefront ———

async function resolveTiendaBySlug(connection, slug) {
  const [[tienda]] = await connection.query(
    `SELECT id_tienda, slug, estado FROM tienda WHERE slug = ? LIMIT 1`,
    [slug]
  );
  return tienda;
}

export const storeEntregaOpciones = async (req, res) => {
  const { slug } = req.params;
  const subtotal = Number(req.query.subtotal || 0);
  const id_sucursal = req.query.id_sucursal ? Number(req.query.id_sucursal) : null;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const tienda = await resolveTiendaBySlug(connection, slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const { opciones } = await listOpcionesEntrega(connection, {
      id_tienda: tienda.id_tienda,
      subtotal,
      id_sucursal,
    });

    // Datos auxiliares públicos
    const [destinos] = await connection.query(
      `SELECT id_destino, departamento, provincia, costo, tiempo_estimado
       FROM ecom_envio_destino WHERE id_tienda = ? AND activo = 1
       ORDER BY departamento, provincia`,
      [tienda.id_tienda]
    );
    const [agencias] = await connection.query(
      `SELECT id_agencia, nombre, telefono, direccion, cobertura_texto
       FROM ecom_envio_agencia WHERE id_tienda = ? AND activo = 1
       ORDER BY nombre`,
      [tienda.id_tienda]
    );
    const [zonas] = await connection.query(
      `SELECT id_zona, nombre, costo, tiempo_estimado, id_sucursal, geojson
       FROM ecom_delivery_zona WHERE id_tienda = ? AND activo = 1
       ORDER BY orden, id_zona`,
      [tienda.id_tienda]
    );

    return res.json({
      success: true,
      data: {
        opciones,
        destinos: destinos.map(mapDestino),
        agencias: agencias.map(mapAgencia),
        zonas: zonas.map((z) => ({
          id_zona: z.id_zona,
          nombre: z.nombre,
          costo: Number(z.costo),
          tiempo_estimado: z.tiempo_estimado,
          id_sucursal: z.id_sucursal,
          geojson: parseJsonMaybe(z.geojson),
        })),
      },
    });
  } catch (error) {
    console.error("[entregas.storeOpciones]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

export const storeEntregaCotizar = async (req, res) => {
  const { slug } = req.params;
  const {
    fulfillment,
    subtotal,
    id_sucursal,
    id_zona,
    id_destino,
    lat,
    lng,
  } = req.body;
  let connection;
  try {
    connection = await getEcommerceConnection();
    const tienda = await resolveTiendaBySlug(connection, slug);
    if (!tienda || tienda.estado !== "active") {
      return res.status(404).json({ success: false, message: "Tienda no encontrada." });
    }
    const quote = await cotizarEntrega(connection, {
      id_tienda: tienda.id_tienda,
      fulfillment,
      subtotal: Number(subtotal || 0),
      id_sucursal: id_sucursal || null,
      id_zona: id_zona || null,
      id_destino: id_destino || null,
      punto: lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null,
    });
    return res.json({ success: true, data: quote });
  } catch (error) {
    console.error("[entregas.storeCotizar]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};

/** KPIs por método de entrega (dashboard). */
export const getEntregaDashboardKpis = async (req, res) => {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [[row]] = await connection.query(
      `SELECT
         SUM(CASE WHEN fulfillment = 'pickup' THEN 1 ELSE 0 END) AS pickup_total,
         SUM(CASE WHEN fulfillment = 'delivery' THEN 1 ELSE 0 END) AS delivery_total,
         SUM(CASE WHEN fulfillment = 'provincia' THEN 1 ELSE 0 END) AS provincia_total,
         SUM(CASE WHEN fulfillment = 'delivery' AND estado_fulfillment IN ('pago_confirmado','preparando','en_camino') THEN 1 ELSE 0 END) AS delivery_activos,
         SUM(CASE WHEN fulfillment = 'provincia' AND estado_fulfillment IN ('pago_confirmado','preparando','en_camino') THEN 1 ELSE 0 END) AS provincia_activos,
         COALESCE(SUM(costo_envio), 0) AS suma_costo_envio,
         COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN costo_envio ELSE 0 END), 0) AS costo_envio_hoy
       FROM orden WHERE id_tienda = ?`,
      [req.id_tienda]
    );
    return res.json({
      success: true,
      data: {
        pickup_total: Number(row?.pickup_total || 0),
        delivery_total: Number(row?.delivery_total || 0),
        provincia_total: Number(row?.provincia_total || 0),
        delivery_activos: Number(row?.delivery_activos || 0),
        provincia_activos: Number(row?.provincia_activos || 0),
        suma_costo_envio: Number(row?.suma_costo_envio || 0),
        costo_envio_hoy: Number(row?.costo_envio_hoy || 0),
      },
    });
  } catch (error) {
    console.error("[entregas.kpis]", error);
    return res.status(500).json({ success: false, message: "Error." });
  } finally {
    if (connection) connection.release();
  }
};
