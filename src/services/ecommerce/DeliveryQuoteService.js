/**
 * Cotización de entrega (retiro / delivery / provincia).
 * Costos siempre recalculados en servidor — no confiar en el cliente.
 */

const MAX_POLYGON_RINGS = 8;
const MAX_RING_POINTS = 200;

/** Ray-casting point-in-polygon (lng/lat). */
export function pointInPolygon(point, polygonCoords) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const [xi, yi] = polygonCoords[i];
    const [xj, yj] = polygonCoords[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pointInGeoJson(lng, lat, geojson) {
  if (!geojson || lng == null || lat == null) return false;
  const geom =
    geojson.type === "Feature" ? geojson.geometry : geojson.type === "FeatureCollection"
      ? geojson.features?.[0]?.geometry
      : geojson;
  if (!geom) return false;

  if (geom.type === "Polygon") {
    const rings = geom.coordinates || [];
    if (!rings[0]?.length) return false;
    if (!pointInPolygon([lng, lat], rings[0])) return false;
    for (let r = 1; r < rings.length; r++) {
      if (pointInPolygon([lng, lat], rings[r])) return false; // hole
    }
    return true;
  }
  if (geom.type === "MultiPolygon") {
    return (geom.coordinates || []).some((poly) => {
      const rings = poly || [];
      if (!rings[0]?.length) return false;
      if (!pointInPolygon([lng, lat], rings[0])) return false;
      for (let r = 1; r < rings.length; r++) {
        if (pointInPolygon([lng, lat], rings[r])) return false;
      }
      return true;
    });
  }
  return false;
}

export function validateGeoJsonPolygon(geojson) {
  if (!geojson || typeof geojson !== "object") {
    return { ok: false, message: "GeoJSON inválido." };
  }
  let geom = geojson;
  if (geojson.type === "Feature") geom = geojson.geometry;
  if (!geom || !["Polygon", "MultiPolygon"].includes(geom.type)) {
    return { ok: false, message: "El mapa debe ser Polygon o MultiPolygon." };
  }
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  if (!Array.isArray(polys) || !polys.length) {
    return { ok: false, message: "Polígono vacío." };
  }
  if (polys.length > MAX_POLYGON_RINGS) {
    return { ok: false, message: "Demasiados anillos en el polígono." };
  }
  for (const rings of polys) {
    if (!Array.isArray(rings) || !rings[0] || rings[0].length < 4) {
      return { ok: false, message: "El polígono necesita al menos 3 vértices (anillo cerrado)." };
    }
    if (rings[0].length > MAX_RING_POINTS) {
      return { ok: false, message: "Demasiados puntos en el polígono." };
    }
  }
  return { ok: true, geometry: geom };
}

function parseJsonMaybe(v) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export async function getOrCreateEntregaConfig(connection, id_tienda) {
  const [[row]] = await connection.query(
    `SELECT * FROM ecom_entrega_config WHERE id_tienda = ? LIMIT 1`,
    [id_tienda]
  );
  if (row) return row;
  await connection.query(
    `INSERT INTO ecom_entrega_config (id_tienda, retiro_activo) VALUES (?, 1)`,
    [id_tienda]
  );
  const [[created]] = await connection.query(
    `SELECT * FROM ecom_entrega_config WHERE id_tienda = ? LIMIT 1`,
    [id_tienda]
  );
  return created;
}

function money(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

/**
 * Cotiza un método concreto.
 * @returns {{ disponible: boolean, costo: number, motivo?: string, zona?: object, destino?: object, tiempo_estimado?: string|null, id_sucursal?: number|null }}
 */
export async function cotizarEntrega(connection, {
  id_tienda,
  fulfillment,
  subtotal,
  id_sucursal = null,
  punto = null, // { lat, lng }
  id_zona = null,
  id_destino = null,
}) {
  const config = await getOrCreateEntregaConfig(connection, id_tienda);
  const sub = money(subtotal);

  if (fulfillment === "pickup") {
    if (!config.retiro_activo) {
      return { disponible: false, costo: 0, motivo: "El retiro en tienda no está activo." };
    }
    return {
      disponible: true,
      costo: 0,
      tiempo_estimado: config.retiro_prep_minutos
        ? `~${config.retiro_prep_minutos} min`
        : null,
      id_sucursal: id_sucursal || null,
    };
  }

  if (fulfillment === "delivery") {
    if (!config.delivery_activo) {
      return { disponible: false, costo: 0, motivo: "El delivery no está activo." };
    }
    const pedidoMin = config.delivery_pedido_min != null ? money(config.delivery_pedido_min) : null;
    if (pedidoMin != null && sub < pedidoMin) {
      return {
        disponible: false,
        costo: 0,
        motivo: `Pedido mínimo para delivery: S/ ${pedidoMin.toFixed(2)}.`,
        pedido_min: pedidoMin,
        falta: money(pedidoMin - sub),
      };
    }

    const gratisDesde =
      config.delivery_gratis_desde != null ? money(config.delivery_gratis_desde) : null;
    const applyGratis = (costo) =>
      gratisDesde != null && sub >= gratisDesde ? 0 : money(costo);

    const modelo = config.delivery_modelo || "zona";

    if (modelo === "fija") {
      return {
        disponible: true,
        costo: applyGratis(config.delivery_costo_base),
        tiempo_estimado: config.delivery_tiempo_texto,
        id_sucursal: id_sucursal || null,
      };
    }

    if (modelo === "base_recargo") {
      return {
        disponible: true,
        costo: applyGratis(
          money(config.delivery_costo_base) + money(config.delivery_recargo)
        ),
        tiempo_estimado: config.delivery_tiempo_texto,
        id_sucursal: id_sucursal || null,
      };
    }

    // modelo zona
    const [zonas] = await connection.query(
      `SELECT z.*, s.nombre AS sucursal_nombre
       FROM ecom_delivery_zona z
       JOIN ecom_sucursal s ON s.id_sucursal = z.id_sucursal AND s.id_tienda = z.id_tienda
       WHERE z.id_tienda = ? AND z.activo = 1 AND s.activo = 1 AND s.allow_delivery = 1
       ORDER BY z.orden ASC, z.id_zona ASC`,
      [id_tienda]
    );

    if (!zonas.length) {
      return { disponible: false, costo: 0, motivo: "No hay zonas de delivery configuradas." };
    }

    let zona = null;
    if (id_zona) {
      zona = zonas.find((z) => Number(z.id_zona) === Number(id_zona)) || null;
      if (!zona) {
        return { disponible: false, costo: 0, motivo: "Zona de delivery inválida." };
      }
    } else if (punto?.lat != null && punto?.lng != null) {
      for (const z of zonas) {
        const geo = parseJsonMaybe(z.geojson);
        if (pointInGeoJson(Number(punto.lng), Number(punto.lat), geo)) {
          zona = z;
          break;
        }
      }
      if (!zona) {
        return {
          disponible: false,
          costo: 0,
          motivo: "Tu ubicación está fuera de las zonas de delivery.",
        };
      }
    } else {
      // Sin punto: devolver la más barata como referencia (no exacta)
      zona = [...zonas].sort((a, b) => Number(a.costo) - Number(b.costo))[0];
      return {
        disponible: true,
        costo: applyGratis(zona.costo),
        aproximado: true,
        tiempo_estimado: zona.tiempo_estimado || config.delivery_tiempo_texto,
        zona: { id_zona: zona.id_zona, nombre: zona.nombre, costo: money(zona.costo) },
        id_sucursal: zona.id_sucursal,
      };
    }

    const zonaMin = zona.pedido_min != null ? money(zona.pedido_min) : null;
    if (zonaMin != null && sub < zonaMin) {
      return {
        disponible: false,
        costo: 0,
        motivo: `Pedido mínimo en ${zona.nombre}: S/ ${zonaMin.toFixed(2)}.`,
        zona: { id_zona: zona.id_zona, nombre: zona.nombre },
      };
    }

    return {
      disponible: true,
      costo: applyGratis(zona.costo),
      tiempo_estimado: zona.tiempo_estimado || config.delivery_tiempo_texto,
      zona: {
        id_zona: zona.id_zona,
        nombre: zona.nombre,
        costo: money(zona.costo),
        id_sucursal: zona.id_sucursal,
        sucursal_nombre: zona.sucursal_nombre,
      },
      id_sucursal: zona.id_sucursal,
    };
  }

  if (fulfillment === "provincia") {
    if (!config.provincia_activo) {
      return { disponible: false, costo: 0, motivo: "El envío a provincia no está activo." };
    }
    const pedidoMin =
      config.provincia_pedido_min != null ? money(config.provincia_pedido_min) : null;
    if (pedidoMin != null && sub < pedidoMin) {
      return {
        disponible: false,
        costo: 0,
        motivo: `Pedido mínimo para provincia: S/ ${pedidoMin.toFixed(2)}.`,
        falta: money(pedidoMin - sub),
      };
    }

    if (!id_destino) {
      const [[minRow]] = await connection.query(
        `SELECT MIN(costo) AS desde FROM ecom_envio_destino
         WHERE id_tienda = ? AND activo = 1`,
        [id_tienda]
      );
      if (minRow?.desde == null) {
        return { disponible: false, costo: 0, motivo: "No hay destinos de provincia configurados." };
      }
      return {
        disponible: true,
        costo: money(minRow.desde),
        aproximado: true,
      };
    }

    const [[destino]] = await connection.query(
      `SELECT * FROM ecom_envio_destino
       WHERE id_destino = ? AND id_tienda = ? AND activo = 1 LIMIT 1`,
      [id_destino, id_tienda]
    );
    if (!destino) {
      return { disponible: false, costo: 0, motivo: "Destino inválido." };
    }
    return {
      disponible: true,
      costo: money(destino.costo),
      tiempo_estimado: destino.tiempo_estimado,
      destino: {
        id_destino: destino.id_destino,
        departamento: destino.departamento,
        provincia: destino.provincia,
        costo: money(destino.costo),
      },
    };
  }

  return { disponible: false, costo: 0, motivo: "Método de entrega no reconocido." };
}

/** Resumen público de opciones activas (+ “desde S/”). */
export async function listOpcionesEntrega(connection, { id_tienda, subtotal = 0, id_sucursal = null }) {
  const config = await getOrCreateEntregaConfig(connection, id_tienda);
  const sub = money(subtotal);
  const opciones = [];

  if (config.retiro_activo) {
    const q = await cotizarEntrega(connection, {
      id_tienda,
      fulfillment: "pickup",
      subtotal: sub,
      id_sucursal,
    });
    opciones.push({
      fulfillment: "pickup",
      label: "Retiro en tienda",
      activo: true,
      desde: 0,
      gratis: true,
      tiempo_estimado: q.tiempo_estimado,
      instrucciones: config.retiro_instrucciones,
    });
  }

  if (config.delivery_activo) {
    const q = await cotizarEntrega(connection, {
      id_tienda,
      fulfillment: "delivery",
      subtotal: sub,
      id_sucursal,
    });
    opciones.push({
      fulfillment: "delivery",
      label: "Delivery",
      activo: true,
      desde: q.disponible || q.aproximado ? q.costo : null,
      disponible: q.disponible,
      motivo: q.motivo || null,
      gratis_desde: config.delivery_gratis_desde != null ? money(config.delivery_gratis_desde) : null,
      pedido_min: config.delivery_pedido_min != null ? money(config.delivery_pedido_min) : null,
      tiempo_estimado: config.delivery_tiempo_texto,
      modelo: config.delivery_modelo,
    });
  }

  if (config.provincia_activo) {
    const q = await cotizarEntrega(connection, {
      id_tienda,
      fulfillment: "provincia",
      subtotal: sub,
    });
    opciones.push({
      fulfillment: "provincia",
      label: "Envío a provincia",
      activo: true,
      desde: q.disponible || q.aproximado ? q.costo : null,
      disponible: q.disponible,
      motivo: q.motivo || null,
      pedido_min: config.provincia_pedido_min != null ? money(config.provincia_pedido_min) : null,
      requiere_agencia: Boolean(config.provincia_requiere_agencia),
      condiciones: config.provincia_condiciones,
    });
  }

  return { config, opciones };
}

export function mapConfigPublic(row) {
  if (!row) return null;
  return {
    retiro_activo: Boolean(row.retiro_activo),
    delivery_activo: Boolean(row.delivery_activo),
    provincia_activo: Boolean(row.provincia_activo),
    retiro_prep_minutos: row.retiro_prep_minutos,
    retiro_instrucciones: row.retiro_instrucciones,
    delivery_modelo: row.delivery_modelo,
    delivery_costo_base: money(row.delivery_costo_base),
    delivery_recargo: money(row.delivery_recargo),
    delivery_pedido_min: row.delivery_pedido_min != null ? money(row.delivery_pedido_min) : null,
    delivery_gratis_desde:
      row.delivery_gratis_desde != null ? money(row.delivery_gratis_desde) : null,
    delivery_tiempo_texto: row.delivery_tiempo_texto,
    provincia_pedido_min:
      row.provincia_pedido_min != null ? money(row.provincia_pedido_min) : null,
    provincia_condiciones: row.provincia_condiciones,
    provincia_requiere_agencia: Boolean(row.provincia_requiere_agencia),
  };
}
