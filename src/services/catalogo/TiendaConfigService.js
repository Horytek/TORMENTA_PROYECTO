/**
 * Resolución de tenant/tienda pública y CRUD de tienda_config.
 */
export async function resolveTenantBySlug(cx, slug) {
  const clean = String(slug || "").trim().toLowerCase();
  if (!clean) return null;

  const [[row]] = await cx.query(
    `SELECT tc.*, e.nombreComercial, e.razonSocial, e.telefono AS empresa_telefono,
            e.logotipo, e.direccion
     FROM tienda_config tc
     INNER JOIN empresa e ON e.id_tenant = tc.id_tenant
     WHERE tc.slug = ? AND tc.activo = 1
     LIMIT 1`,
    [clean]
  );
  if (row) return row;

  // Alias legacy: /s/t1 → tenant 1 (slug canónico puede ser otro, p.ej. textiles-creando-moda)
  const m = clean.match(/^t(\d+)$/);
  if (m) {
    const id = Number(m[1]);
    const [[byId]] = await cx.query(
      `SELECT tc.*, e.nombreComercial, e.razonSocial, e.telefono AS empresa_telefono,
              e.logotipo, e.direccion
       FROM tienda_config tc
       INNER JOIN empresa e ON e.id_tenant = tc.id_tenant
       WHERE tc.id_tenant = ? AND tc.activo = 1
       LIMIT 1`,
      [id]
    );
    return byId || null;
  }

  return null;
}

export async function resolveTenantById(cx, id_tenant) {
  const id = Number(id_tenant);
  if (!Number.isInteger(id) || id <= 0) return null;

  // Preferir config de tienda si la migración ya corrió.
  try {
    const [[cfg]] = await cx.query(
      `SELECT tc.*, e.nombreComercial, e.razonSocial, e.telefono AS empresa_telefono,
              e.logotipo, e.direccion, e.id_tenant
       FROM empresa e
       LEFT JOIN tienda_config tc ON tc.id_tenant = e.id_tenant
       WHERE e.id_tenant = ?
       LIMIT 1`,
      [id]
    );
    return cfg || null;
  } catch (err) {
    // Tabla tienda_config aún no existe → catálogo legacy solo con empresa.
    if (err?.code !== "ER_NO_SUCH_TABLE") throw err;
    const [[empresa]] = await cx.query(
      `SELECT id_tenant, nombreComercial, razonSocial, telefono AS empresa_telefono,
              logotipo, direccion
       FROM empresa WHERE id_tenant = ? LIMIT 1`,
      [id]
    );
    return empresa || null;
  }
}

export function parseThemeJson(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    const v = JSON.parse(String(raw));
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

export function toPublicStorefront(cfg) {
  if (!cfg) return null;
  const nombre =
    cfg.nombre_publico || cfg.nombreComercial || cfg.razonSocial || "Tienda";
  const theme = parseThemeJson(cfg.theme_json);
  return {
    id_tenant: cfg.id_tenant,
    slug: cfg.slug || String(cfg.id_tenant),
    activo: cfg.activo == null ? 1 : Number(cfg.activo),
    nombre,
    telefono: cfg.whatsapp || cfg.empresa_telefono || null,
    logo: cfg.logo_url || cfg.logotipo || null,
    logo_url: cfg.logo_url || cfg.logotipo || null,
    banner: cfg.banner_url || theme?.banner_url || null,
    banner_url: cfg.banner_url || theme?.banner_url || null,
    direccion: cfg.direccion || null,
    color_primario: cfg.color_primario || null,
    color_acento: cfg.color_acento || null,
    mensaje_bienvenida: cfg.mensaje_bienvenida || null,
    descripcion: cfg.mensaje_bienvenida || null,
    checkout_habilitado: Number(cfg.checkout_habilitado ?? 1) === 1,
    stock_bajo_umbral: Number(cfg.stock_bajo_umbral ?? 5),
    mp_conectado: Boolean(cfg.mp_access_token_enc),
    mp_public_key: cfg.mp_public_key || null,
    mp_modo: cfg.mp_modo || "test",
    theme_json: theme,
    whatsapp: cfg.whatsapp || null,
  };
}

export async function getOrCreateConfig(cx, id_tenant) {
  const [[existing]] = await cx.query(
    `SELECT * FROM tienda_config WHERE id_tenant = ? LIMIT 1`,
    [id_tenant]
  );
  if (existing) return existing;

  const slug = `t${id_tenant}`;
  await cx.query(
    `INSERT INTO tienda_config (id_tenant, activo, slug)
     VALUES (?, 0, ?)
     ON DUPLICATE KEY UPDATE id_tenant = id_tenant`,
    [id_tenant, slug]
  );
  const [[row]] = await cx.query(
    `SELECT * FROM tienda_config WHERE id_tenant = ? LIMIT 1`,
    [id_tenant]
  );
  return row;
}

export async function upsertConfig(cx, id_tenant, patch) {
  await getOrCreateConfig(cx, id_tenant);

  const allowed = [
    "activo",
    "slug",
    "nombre_publico",
    "whatsapp",
    "color_primario",
    "color_acento",
    "banner_url",
    "logo_url",
    "mensaje_bienvenida",
    "checkout_habilitado",
    "emitir_cpe",
    "stock_bajo_umbral",
    "mp_public_key",
    "mp_access_token_enc",
    "mp_modo",
    "theme_json",
  ];

  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (patch[key] === undefined) continue;
    sets.push(`${key} = ?`);
    params.push(
      key === "theme_json" && patch[key] != null && typeof patch[key] === "object"
        ? JSON.stringify(patch[key])
        : patch[key]
    );
  }
  if (sets.length === 0) {
    return getOrCreateConfig(cx, id_tenant);
  }

  params.push(id_tenant);
  await cx.query(
    `UPDATE tienda_config SET ${sets.join(", ")} WHERE id_tenant = ?`,
    params
  );
  return getOrCreateConfig(cx, id_tenant);
}

function mapOverlaySucursal(r, { publico = true } = {}) {
  const esOficina = /^oficina$/i.test(String(r.nombre || "").trim());
  const visible =
    r.visible == null ? (esOficina ? 0 : 1) : Number(r.visible) === 1 ? 1 : 0;
  if (publico && !visible) return null;
  return {
    id_sucursal: r.id_sucursal,
    nombre: r.nombre,
    direccion: r.direccion || null,
    telefono: r.telefono || null,
    whatsapp: r.whatsapp || r.telefono || null,
    allow_pickup: r.allow_pickup == null ? true : Number(r.allow_pickup) === 1,
    allow_delivery: r.allow_delivery == null ? false : Number(r.allow_delivery) === 1,
    es_default: Number(r.es_default) === 1,
    visible: Boolean(visible),
    estado_sucursal: r.estado_sucursal == null ? 1 : Number(r.estado_sucursal),
    id_almacenes: r.almacenes
      ? String(r.almacenes).split(",").map(Number).filter(Boolean)
      : [],
  };
}

export async function listSucursalesPublicas(cx, id_tenant) {
  try {
    const [rows] = await cx.query(
      `SELECT s.id_sucursal, s.nombre_sucursal AS nombre, s.ubicacion AS direccion,
              s.estado_sucursal,
              GROUP_CONCAT(sa.id_almacen) AS almacenes,
              ts.visible, ts.allow_pickup, ts.allow_delivery, ts.es_default,
              ts.whatsapp, ts.telefono
       FROM sucursal s
       LEFT JOIN sucursal_almacen sa ON sa.id_sucursal = s.id_sucursal
       LEFT JOIN tienda_sucursal ts ON ts.id_sucursal = s.id_sucursal AND ts.id_tenant = s.id_tenant
       WHERE s.id_tenant = ? AND (s.estado_sucursal = 1 OR s.estado_sucursal IS NULL)
       GROUP BY s.id_sucursal
       ORDER BY COALESCE(ts.es_default, 0) DESC, s.nombre_sucursal`,
      [id_tenant]
    );
    return rows.map((r) => mapOverlaySucursal(r, { publico: true })).filter(Boolean);
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") {
      try {
        const [rows] = await cx.query(
          `SELECT s.id_sucursal, s.nombre_sucursal AS nombre, s.ubicacion AS direccion,
                  s.estado_sucursal,
                  GROUP_CONCAT(sa.id_almacen) AS almacenes
           FROM sucursal s
           LEFT JOIN sucursal_almacen sa ON sa.id_sucursal = s.id_sucursal
           WHERE s.id_tenant = ? AND (s.estado_sucursal = 1 OR s.estado_sucursal IS NULL)
           GROUP BY s.id_sucursal
           ORDER BY s.nombre_sucursal`,
          [id_tenant]
        );
        return rows.map((r) => mapOverlaySucursal(r, { publico: true })).filter(Boolean);
      } catch (e2) {
        console.warn("listSucursalesPublicas:", e2.message);
        return [];
      }
    }
    console.warn("listSucursalesPublicas:", err.message);
    return [];
  }
}

export async function listSucursalesAdmin(cx, id_tenant) {
  const [rows] = await cx.query(
    `SELECT s.id_sucursal, s.nombre_sucursal AS nombre, s.ubicacion AS direccion,
            s.estado_sucursal,
            GROUP_CONCAT(sa.id_almacen) AS almacenes,
            ts.visible, ts.allow_pickup, ts.allow_delivery, ts.es_default,
            ts.whatsapp, ts.telefono
     FROM sucursal s
     LEFT JOIN sucursal_almacen sa ON sa.id_sucursal = s.id_sucursal
     LEFT JOIN tienda_sucursal ts ON ts.id_sucursal = s.id_sucursal AND ts.id_tenant = s.id_tenant
     WHERE s.id_tenant = ?
     GROUP BY s.id_sucursal
     ORDER BY s.nombre_sucursal`,
    [id_tenant]
  );
  return rows.map((r) => mapOverlaySucursal(r, { publico: false }));
}

export async function upsertSucursalOverlay(cx, id_tenant, id_sucursal, patch) {
  const [[erp]] = await cx.query(
    `SELECT id_sucursal, nombre_sucursal FROM sucursal WHERE id_sucursal = ? AND id_tenant = ? LIMIT 1`,
    [id_sucursal, id_tenant]
  );
  if (!erp) {
    throw Object.assign(new Error("Sucursal no encontrada"), { status: 404 });
  }

  const [[cur]] = await cx.query(
    `SELECT * FROM tienda_sucursal WHERE id_tenant = ? AND id_sucursal = ? LIMIT 1`,
    [id_tenant, id_sucursal]
  );
  const esOficina = /^oficina$/i.test(String(erp.nombre_sucursal || "").trim());
  const next = {
    visible: cur?.visible ?? (esOficina ? 0 : 1),
    allow_pickup: cur?.allow_pickup ?? 1,
    allow_delivery: cur?.allow_delivery ?? 0,
    es_default: cur?.es_default ?? 0,
    whatsapp: cur?.whatsapp ?? null,
    telefono: cur?.telefono ?? null,
  };
  if (patch.visible !== undefined) next.visible = patch.visible ? 1 : 0;
  if (patch.allow_pickup !== undefined) next.allow_pickup = patch.allow_pickup ? 1 : 0;
  if (patch.allow_delivery !== undefined) next.allow_delivery = patch.allow_delivery ? 1 : 0;
  if (patch.es_default !== undefined) next.es_default = patch.es_default ? 1 : 0;
  if (patch.whatsapp !== undefined) next.whatsapp = patch.whatsapp || null;
  if (patch.telefono !== undefined) next.telefono = patch.telefono || null;

  if (next.es_default) {
    await cx.query(`UPDATE tienda_sucursal SET es_default = 0 WHERE id_tenant = ?`, [id_tenant]);
  }

  await cx.query(
    `INSERT INTO tienda_sucursal
       (id_tenant, id_sucursal, visible, allow_pickup, allow_delivery, es_default, whatsapp, telefono)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       visible = VALUES(visible),
       allow_pickup = VALUES(allow_pickup),
       allow_delivery = VALUES(allow_delivery),
       es_default = VALUES(es_default),
       whatsapp = VALUES(whatsapp),
       telefono = VALUES(telefono)`,
    [
      id_tenant,
      id_sucursal,
      next.visible,
      next.allow_pickup,
      next.allow_delivery,
      next.es_default,
      next.whatsapp,
      next.telefono,
    ]
  );
  return listSucursalesAdmin(cx, id_tenant);
}

export async function almacenesDeSucursal(cx, id_sucursal, id_tenant) {
  const [rows] = await cx.query(
    `SELECT sa.id_almacen
     FROM sucursal_almacen sa
     INNER JOIN sucursal s ON s.id_sucursal = sa.id_sucursal
     WHERE sa.id_sucursal = ? AND s.id_tenant = ?`,
    [id_sucursal, id_tenant]
  );
  return rows.map((r) => r.id_almacen);
}
