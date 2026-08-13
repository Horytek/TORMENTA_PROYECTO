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
  return row || null;
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

export function toPublicStorefront(cfg) {
  if (!cfg) return null;
  const nombre =
    cfg.nombre_publico || cfg.nombreComercial || cfg.razonSocial || "Tienda";
  return {
    id_tenant: cfg.id_tenant,
    slug: cfg.slug || String(cfg.id_tenant),
    activo: cfg.activo == null ? 1 : Number(cfg.activo),
    nombre,
    telefono: cfg.whatsapp || cfg.empresa_telefono || null,
    logo: cfg.logo_url || cfg.logotipo || null,
    banner: cfg.banner_url || null,
    direccion: cfg.direccion || null,
    color_primario: cfg.color_primario || null,
    color_acento: cfg.color_acento || null,
    mensaje_bienvenida: cfg.mensaje_bienvenida || null,
    checkout_habilitado: Number(cfg.checkout_habilitado ?? 1) === 1,
    stock_bajo_umbral: Number(cfg.stock_bajo_umbral ?? 5),
    mp_conectado: Boolean(cfg.mp_access_token_enc),
    mp_public_key: cfg.mp_public_key || null,
    mp_modo: cfg.mp_modo || "test",
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

export async function listSucursalesPublicas(cx, id_tenant) {
  try {
    const [rows] = await cx.query(
      `SELECT s.id_sucursal, s.nombre_sucursal AS nombre, s.ubicacion AS direccion,
              GROUP_CONCAT(sa.id_almacen) AS almacenes
       FROM sucursal s
       LEFT JOIN sucursal_almacen sa ON sa.id_sucursal = s.id_sucursal
       WHERE s.id_tenant = ? AND (s.estado_sucursal = 1 OR s.estado_sucursal IS NULL)
       GROUP BY s.id_sucursal
       ORDER BY s.nombre_sucursal`,
      [id_tenant]
    );
    return rows.map((r) => ({
      id_sucursal: r.id_sucursal,
      nombre: r.nombre,
      direccion: r.direccion || null,
      telefono: null,
      id_almacenes: r.almacenes
        ? String(r.almacenes).split(",").map(Number).filter(Boolean)
        : [],
    }));
  } catch (err) {
    console.warn("listSucursalesPublicas:", err.message);
    return [];
  }
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
