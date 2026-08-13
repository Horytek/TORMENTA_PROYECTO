/**
 * Cotización y CRUD de entrega para Tienda web ERP (db_tormenta).
 */

function money(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Number(v.toFixed(2)) : 0;
}

function parseDistritos(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export async function getEntregaConfig(cx, id_tenant) {
  const [[row]] = await cx.query(
    `SELECT * FROM tienda_entrega_config WHERE id_tenant = ? LIMIT 1`,
    [id_tenant]
  );
  if (row) return row;
  await cx.query(
    `INSERT INTO tienda_entrega_config (id_tenant, retiro_activo, delivery_activo)
     VALUES (?, 1, 0)
     ON DUPLICATE KEY UPDATE id_tenant = id_tenant`,
    [id_tenant]
  );
  const [[created]] = await cx.query(
    `SELECT * FROM tienda_entrega_config WHERE id_tenant = ? LIMIT 1`,
    [id_tenant]
  );
  return created || { id_tenant, retiro_activo: 1, delivery_activo: 0, provincia_activo: 0 };
}

export async function saveEntregaConfig(cx, id_tenant, patch) {
  await getEntregaConfig(cx, id_tenant);
  const allowed = [
    "retiro_activo",
    "delivery_activo",
    "provincia_activo",
    "costo_default",
    "tiempo_preparacion_min",
    "retiro_prep_minutos",
    "retiro_instrucciones",
    "delivery_pedido_min",
    "delivery_gratis_desde",
    "provincia_pedido_min",
    "provincia_condiciones",
    "provincia_requiere_agencia",
  ];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (patch[key] === undefined) continue;
    if (
      key === "retiro_activo" ||
      key === "delivery_activo" ||
      key === "provincia_activo" ||
      key === "provincia_requiere_agencia"
    ) {
      sets.push(`${key} = ?`);
      params.push(patch[key] ? 1 : 0);
    } else if (
      key === "costo_default" ||
      key === "delivery_pedido_min" ||
      key === "delivery_gratis_desde" ||
      key === "provincia_pedido_min"
    ) {
      sets.push(`${key} = ?`);
      params.push(patch[key] == null || patch[key] === "" ? null : money(patch[key]));
    } else {
      sets.push(`${key} = ?`);
      params.push(patch[key] == null || patch[key] === "" ? null : patch[key]);
    }
  }
  if (!sets.length) return getEntregaConfig(cx, id_tenant);
  params.push(id_tenant);
  await cx.query(
    `UPDATE tienda_entrega_config SET ${sets.join(", ")} WHERE id_tenant = ?`,
    params
  );
  return getEntregaConfig(cx, id_tenant);
}

export async function listZonas(cx, id_tenant, { soloActivas = false } = {}) {
  const [rows] = await cx.query(
    `SELECT * FROM tienda_delivery_zona WHERE id_tenant = ? ${
      soloActivas ? "AND activo = 1" : ""
    } ORDER BY orden, nombre`,
    [id_tenant]
  );
  return rows.map((z) => ({
    ...z,
    costo: money(z.costo),
    distritos: parseDistritos(z.distritos),
  }));
}

export async function upsertZona(cx, id_tenant, zona) {
  const distritos = JSON.stringify(zona.distritos || []);
  if (zona.id_zona) {
    await cx.query(
      `UPDATE tienda_delivery_zona SET nombre=?, distritos=?, costo=?, activo=?, orden=?
       WHERE id_zona=? AND id_tenant=?`,
      [
        zona.nombre,
        distritos,
        money(zona.costo),
        zona.activo === false || zona.activo === 0 ? 0 : 1,
        Number(zona.orden) || 0,
        zona.id_zona,
        id_tenant,
      ]
    );
    return zona.id_zona;
  }
  const [ins] = await cx.query(
    `INSERT INTO tienda_delivery_zona (id_tenant, nombre, distritos, costo, activo, orden)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [id_tenant, zona.nombre, distritos, money(zona.costo), Number(zona.orden) || 0]
  );
  return ins.insertId;
}

export async function deleteZona(cx, id_tenant, id_zona) {
  await cx.query(
    `UPDATE tienda_delivery_zona SET activo = 0 WHERE id_zona = ? AND id_tenant = ?`,
    [id_zona, id_tenant]
  );
}

export async function listDestinos(cx, id_tenant, { soloActivas = false } = {}) {
  const [rows] = await cx.query(
    `SELECT * FROM tienda_envio_destino WHERE id_tenant = ? ${
      soloActivas ? "AND activo = 1" : ""
    } ORDER BY departamento, provincia`,
    [id_tenant]
  );
  return rows.map((d) => ({ ...d, costo: money(d.costo) }));
}

export async function upsertDestino(cx, id_tenant, body) {
  if (body.id_destino) {
    await cx.query(
      `UPDATE tienda_envio_destino SET departamento=?, provincia=?, costo=?, tiempo_estimado=?, activo=?
       WHERE id_destino=? AND id_tenant=?`,
      [
        body.departamento,
        body.provincia || null,
        money(body.costo),
        body.tiempo_estimado || null,
        body.activo === false || body.activo === 0 ? 0 : 1,
        body.id_destino,
        id_tenant,
      ]
    );
    return body.id_destino;
  }
  const [ins] = await cx.query(
    `INSERT INTO tienda_envio_destino (id_tenant, departamento, provincia, costo, tiempo_estimado, activo)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [
      id_tenant,
      body.departamento,
      body.provincia || null,
      money(body.costo),
      body.tiempo_estimado || null,
    ]
  );
  return ins.insertId;
}

export async function deleteDestino(cx, id_tenant, id_destino) {
  await cx.query(
    `UPDATE tienda_envio_destino SET activo = 0 WHERE id_destino = ? AND id_tenant = ?`,
    [id_destino, id_tenant]
  );
}

export async function listAgencias(cx, id_tenant, { soloActivas = false } = {}) {
  const [rows] = await cx.query(
    `SELECT * FROM tienda_envio_agencia WHERE id_tenant = ? ${
      soloActivas ? "AND activo = 1" : ""
    } ORDER BY nombre`,
    [id_tenant]
  );
  return rows;
}

export async function upsertAgencia(cx, id_tenant, body) {
  if (body.id_agencia) {
    await cx.query(
      `UPDATE tienda_envio_agencia SET nombre=?, telefono=?, direccion=?, cobertura_texto=?, observaciones=?, activo=?
       WHERE id_agencia=? AND id_tenant=?`,
      [
        body.nombre,
        body.telefono || null,
        body.direccion || null,
        body.cobertura_texto || null,
        body.observaciones || null,
        body.activo === false || body.activo === 0 ? 0 : 1,
        body.id_agencia,
        id_tenant,
      ]
    );
    return body.id_agencia;
  }
  const [ins] = await cx.query(
    `INSERT INTO tienda_envio_agencia (id_tenant, nombre, telefono, direccion, cobertura_texto, observaciones, activo)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [
      id_tenant,
      body.nombre,
      body.telefono || null,
      body.direccion || null,
      body.cobertura_texto || null,
      body.observaciones || null,
    ]
  );
  return ins.insertId;
}

export async function deleteAgencia(cx, id_tenant, id_agencia) {
  await cx.query(
    `UPDATE tienda_envio_agencia SET activo = 0 WHERE id_agencia = ? AND id_tenant = ?`,
    [id_agencia, id_tenant]
  );
}

export async function cotizarEntrega(cx, id_tenant, body = {}) {
  const fulfillment = body.fulfillment || (body.distrito ? "delivery" : "pickup");
  const config = await getEntregaConfig(cx, id_tenant);
  const sub = money(body.subtotal);

  if (fulfillment === "pickup" || fulfillment === "retiro") {
    if (!Number(config.retiro_activo)) {
      return { disponible: false, costo: 0, motivo: "El retiro en tienda no está activo." };
    }
    return { disponible: true, costo: 0, fulfillment: "pickup" };
  }

  if (fulfillment === "delivery") {
    if (!Number(config.delivery_activo)) {
      return { disponible: false, costo: 0, motivo: "El delivery no está activo." };
    }
    if (config.delivery_pedido_min != null && sub < money(config.delivery_pedido_min)) {
      return {
        disponible: false,
        costo: 0,
        motivo: `Pedido mínimo para delivery: S/ ${money(config.delivery_pedido_min).toFixed(2)}.`,
      };
    }
    const zonas = await listZonas(cx, id_tenant, { soloActivas: true });
    const distrito = String(body.distrito || "").trim().toLowerCase();
    let zona = null;
    if (body.id_zona) {
      zona = zonas.find((z) => Number(z.id_zona) === Number(body.id_zona)) || null;
    } else if (distrito) {
      zona = zonas.find((z) =>
        (z.distritos || []).some((d) => String(d).toLowerCase() === distrito)
      );
    }
    let costo = zona ? money(zona.costo) : money(config.costo_default);
    if (config.delivery_gratis_desde != null && sub >= money(config.delivery_gratis_desde)) {
      costo = 0;
    }
    return {
      disponible: true,
      costo,
      zona: zona ? { id_zona: zona.id_zona, nombre: zona.nombre } : null,
      fulfillment: "delivery",
    };
  }

  if (fulfillment === "provincia") {
    if (!Number(config.provincia_activo)) {
      return { disponible: false, costo: 0, motivo: "El envío a provincia no está activo." };
    }
    if (config.provincia_pedido_min != null && sub < money(config.provincia_pedido_min)) {
      return {
        disponible: false,
        costo: 0,
        motivo: `Pedido mínimo para provincia: S/ ${money(config.provincia_pedido_min).toFixed(2)}.`,
      };
    }
    const destinos = await listDestinos(cx, id_tenant, { soloActivas: true });
    if (!destinos.length) {
      return { disponible: false, costo: 0, motivo: "No hay destinos de provincia configurados." };
    }
    const destino = body.id_destino
      ? destinos.find((d) => Number(d.id_destino) === Number(body.id_destino))
      : destinos[0];
    if (body.id_destino && !destino) {
      return { disponible: false, costo: 0, motivo: "Elige un destino de provincia." };
    }
    return {
      disponible: Boolean(destino),
      costo: destino ? money(destino.costo) : money(destinos[0].costo),
      aproximado: !body.id_destino,
      destino: destino
        ? {
            id_destino: destino.id_destino,
            departamento: destino.departamento,
            provincia: destino.provincia,
          }
        : null,
      fulfillment: "provincia",
    };
  }

  return { disponible: false, costo: 0, motivo: "Método de entrega no válido." };
}

export async function listOpcionesEntrega(cx, id_tenant, { subtotal = 0 } = {}) {
  const config = await getEntregaConfig(cx, id_tenant);
  const opciones = [];
  const sub = money(subtotal);

  if (Number(config.retiro_activo)) {
    opciones.push({
      fulfillment: "pickup",
      label: "Retiro en tienda",
      activo: true,
      desde: 0,
      disponible: true,
    });
  }
  if (Number(config.delivery_activo)) {
    const q = await cotizarEntrega(cx, id_tenant, { fulfillment: "delivery", subtotal: sub });
    opciones.push({
      fulfillment: "delivery",
      label: "Delivery",
      activo: true,
      desde: q.disponible ? q.costo : null,
      disponible: q.disponible,
      motivo: q.motivo || null,
      gratis_desde:
        config.delivery_gratis_desde != null ? money(config.delivery_gratis_desde) : null,
    });
  }
  if (Number(config.provincia_activo)) {
    const q = await cotizarEntrega(cx, id_tenant, { fulfillment: "provincia", subtotal: sub });
    opciones.push({
      fulfillment: "provincia",
      label: "Envío a provincia",
      activo: true,
      desde: q.disponible || q.aproximado ? q.costo : null,
      disponible: q.disponible || q.aproximado,
      motivo: q.motivo || null,
      requiere_agencia: Boolean(config.provincia_requiere_agencia),
      condiciones: config.provincia_condiciones,
    });
  }

  const [zonas, destinos, agencias] = await Promise.all([
    Number(config.delivery_activo) ? listZonas(cx, id_tenant, { soloActivas: true }) : [],
    Number(config.provincia_activo) ? listDestinos(cx, id_tenant, { soloActivas: true }) : [],
    Number(config.provincia_activo) ? listAgencias(cx, id_tenant, { soloActivas: true }) : [],
  ]);

  return {
    opciones,
    zonas,
    destinos,
    agencias,
    retiro_instrucciones: config.retiro_instrucciones,
    provincia_requiere_agencia: Boolean(config.provincia_requiere_agencia),
  };
}
