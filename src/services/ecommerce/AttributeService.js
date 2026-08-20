/**
 * Catálogo de atributos por tienda + asignación a producto + variantes cartesianas.
 */

export const ATTR_TIPOS = [
  "texto",
  "numero",
  "seleccion",
  "seleccion_multiple",
  "booleano",
  "rango",
  "color",
  "medida",
];

function slugifyCodigo(text) {
  return (
    String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 60) || "attr"
  );
}

function cartesian(lists) {
  if (!lists.length) return [[]];
  return lists.reduce((acc, list) => acc.flatMap((a) => list.map((b) => [...a, b])), [[]]);
}

function parseJson(v) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

const HEX_LEGACY_FALLBACK = "#94a3b8";

function normalizeHex(hex, fallback = HEX_LEGACY_FALLBACK) {
  if (typeof hex !== "string") return fallback;
  const t = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(t)) return `#${t.toLowerCase()}`;
  if (/^#[0-9a-fA-F]{3}$/.test(t)) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function codigoEsTalla(codigo, nombre) {
  const c = String(codigo || "").toLowerCase();
  const n = String(nombre || "").toLowerCase();
  return c === "talla" || n === "talla";
}

function codigoEsTonalidad(codigo, nombre, tipo) {
  const c = String(codigo || "").toLowerCase();
  const n = String(nombre || "").toLowerCase();
  return (
    c === "tonalidad" ||
    c === "color" ||
    n === "tonalidad" ||
    n === "color" ||
    tipo === "color"
  );
}

/** Atributos del producto que generan filas de inventario (cartesianas). */
async function readInventarioAtributoIds(connection, id_tienda, id_producto, attrs) {
  const [[row]] = await connection.query(
    `SELECT attrs_json FROM producto WHERE id_producto = ? AND id_tienda = ? LIMIT 1`,
    [id_producto, id_tienda]
  );
  const current = parseJson(row?.attrs_json) || {};
  if (Array.isArray(current.inventario_atributos)) {
    return current.inventario_atributos.map(Number).filter(Boolean);
  }
  return [];
}

function resolveControlaInventario(item, attr) {
  if (item.controla_inventario !== undefined) return Boolean(item.controla_inventario);
  return false;
}

async function persistInventarioAtributos(connection, id_tienda, id_producto, inventarioAtributos) {
  const [[row]] = await connection.query(
    `SELECT attrs_json FROM producto WHERE id_producto = ? AND id_tienda = ? LIMIT 1`,
    [id_producto, id_tienda]
  );
  const current = parseJson(row?.attrs_json) || {};
  const next = {
    ...current,
    inventario_atributos: inventarioAtributos,
  };
  await connection.query(
    `UPDATE producto SET attrs_json = ? WHERE id_producto = ? AND id_tienda = ?`,
    [JSON.stringify(next), id_producto, id_tienda]
  );
}

export function mapAtributo(row, valores = []) {
  if (!row) return null;
  return {
    id_atributo: row.id_atributo,
    codigo: row.codigo,
    nombre: row.nombre,
    tipo: row.tipo,
    es_variante: Boolean(row.es_variante),
    activo: Boolean(row.activo),
    orden: Number(row.orden || 0),
    valores: valores.map((v) => ({
      id_valor: v.id_valor,
      valor: v.valor,
      hex: v.hex || null,
      orden: Number(v.orden || 0),
      activo: Boolean(v.activo),
    })),
  };
}

export async function listAtributos(connection, id_tienda, { q, tipo, activo } = {}) {
  let sql = `SELECT * FROM ecom_atributo WHERE id_tienda = ?`;
  const params = [id_tienda];
  if (tipo) {
    sql += ` AND tipo = ?`;
    params.push(tipo);
  }
  if (activo === "1" || activo === "0") {
    sql += ` AND activo = ?`;
    params.push(Number(activo));
  }
  if (q && String(q).trim()) {
    sql += ` AND (nombre LIKE ? OR codigo LIKE ?)`;
    const term = `%${String(q).trim()}%`;
    params.push(term, term);
  }
  sql += ` ORDER BY orden ASC, nombre ASC`;
  const [rows] = await connection.query(sql, params);
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id_atributo);
  const [vals] = await connection.query(
    `SELECT * FROM ecom_atributo_valor WHERE id_tienda = ? AND id_atributo IN (?)
     ORDER BY orden ASC, id_valor ASC`,
    [id_tienda, ids]
  );
  const byAttr = new Map();
  for (const v of vals) {
    if (!byAttr.has(v.id_atributo)) byAttr.set(v.id_atributo, []);
    byAttr.get(v.id_atributo).push(v);
  }
  const counts = await countProductosPorAtributo(connection, id_tienda, ids);
  return rows.map((r) => ({
    ...mapAtributo(r, byAttr.get(r.id_atributo) || []),
    productos_count: counts.get(r.id_atributo) || 0,
  }));
}

async function countProductosPorAtributo(connection, id_tienda, ids) {
  if (!ids.length) return new Map();
  const [rows] = await connection.query(
    `SELECT id_atributo, COUNT(*) AS n FROM ecom_producto_atributo
     WHERE id_tienda = ? AND id_atributo IN (?) GROUP BY id_atributo`,
    [id_tienda, ids]
  );
  return new Map(rows.map((r) => [r.id_atributo, Number(r.n)]));
}

export async function getAtributo(connection, id_tienda, id_atributo) {
  const [[row]] = await connection.query(
    `SELECT * FROM ecom_atributo WHERE id_atributo = ? AND id_tienda = ? LIMIT 1`,
    [id_atributo, id_tienda]
  );
  if (!row) return null;
  const [vals] = await connection.query(
    `SELECT * FROM ecom_atributo_valor WHERE id_atributo = ? AND id_tienda = ?
     ORDER BY orden ASC, id_valor ASC`,
    [id_atributo, id_tienda]
  );
  const counts = await countProductosPorAtributo(connection, id_tienda, [id_atributo]);
  return {
    ...mapAtributo(row, vals),
    productos_count: counts.get(id_atributo) || 0,
  };
}

export async function createAtributo(connection, id_tienda, body) {
  const nombre = String(body.nombre || "").trim();
  if (!nombre) throw Object.assign(new Error("Nombre requerido."), { status: 400 });
  const codigo = slugifyCodigo(body.codigo || nombre);
  const tipo = ATTR_TIPOS.includes(body.tipo) ? body.tipo : "seleccion";
  const es_variante = body.es_variante ? 1 : 0;
  if (es_variante && tipo !== "seleccion" && tipo !== "color") {
    throw Object.assign(new Error("Solo selección o color pueden ser atributos de variante."), {
      status: 400,
    });
  }
  const [[max]] = await connection.query(
    `SELECT COALESCE(MAX(orden), 0) AS m FROM ecom_atributo WHERE id_tienda = ?`,
    [id_tienda]
  );
  try {
    const [ins] = await connection.query(
      `INSERT INTO ecom_atributo (id_tienda, codigo, nombre, tipo, es_variante, activo, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_tienda, codigo, nombre, tipo, es_variante, body.activo === false ? 0 : 1, Number(max.m) + 10]
    );
    if (Array.isArray(body.valores)) {
      let i = 0;
      for (const v of body.valores) {
        const valor = String(v.valor || v.nombre || "").trim();
        if (!valor) continue;
        await connection.query(
          `INSERT INTO ecom_atributo_valor (id_atributo, id_tienda, valor, hex, orden, activo)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [ins.insertId, id_tienda, valor, v.hex || null, i++]
        );
      }
    }
    return getAtributo(connection, id_tienda, ins.insertId);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw Object.assign(new Error("Ya existe un atributo con ese código."), { status: 409 });
    }
    throw err;
  }
}

export async function updateAtributo(connection, id_tienda, id_atributo, body) {
  const existing = await getAtributo(connection, id_tienda, id_atributo);
  if (!existing) throw Object.assign(new Error("Atributo no encontrado."), { status: 404 });
  const fields = [];
  const params = [];
  if (body.nombre != null) {
    fields.push("nombre = ?");
    params.push(String(body.nombre).trim());
  }
  if (body.tipo != null) {
    if (!ATTR_TIPOS.includes(body.tipo)) {
      throw Object.assign(new Error("Tipo inválido."), { status: 400 });
    }
    fields.push("tipo = ?");
    params.push(body.tipo);
  }
  if (body.es_variante != null) {
    fields.push("es_variante = ?");
    params.push(body.es_variante ? 1 : 0);
  }
  if (body.activo != null) {
    fields.push("activo = ?");
    params.push(body.activo ? 1 : 0);
  }
  if (body.orden != null) {
    fields.push("orden = ?");
    params.push(Number(body.orden));
  }
  if (fields.length) {
    params.push(id_atributo, id_tienda);
    await connection.query(
      `UPDATE ecom_atributo SET ${fields.join(", ")} WHERE id_atributo = ? AND id_tienda = ?`,
      params
    );
  }
  return getAtributo(connection, id_tienda, id_atributo);
}

export async function deleteAtributo(connection, id_tienda, id_atributo) {
  const [r] = await connection.query(
    `DELETE FROM ecom_atributo WHERE id_atributo = ? AND id_tienda = ?`,
    [id_atributo, id_tienda]
  );
  if (!r.affectedRows) throw Object.assign(new Error("Atributo no encontrado."), { status: 404 });
}

export async function addValor(connection, id_tienda, id_atributo, body) {
  const attr = await getAtributo(connection, id_tienda, id_atributo);
  if (!attr) throw Object.assign(new Error("Atributo no encontrado."), { status: 404 });
  const valor = String(body.valor || "").trim();
  if (!valor) throw Object.assign(new Error("Valor requerido."), { status: 400 });
  const [ins] = await connection.query(
    `INSERT INTO ecom_atributo_valor (id_atributo, id_tienda, valor, hex, orden, activo)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [id_atributo, id_tienda, valor, body.hex || null, Number(body.orden ?? attr.valores.length)]
  );
  return { id_valor: ins.insertId, valor, hex: body.hex || null };
}

export async function updateValor(connection, id_tienda, id_valor, body) {
  const fields = [];
  const params = [];
  if (body.valor != null) {
    fields.push("valor = ?");
    params.push(String(body.valor).trim());
  }
  if (body.hex !== undefined) {
    fields.push("hex = ?");
    params.push(body.hex || null);
  }
  if (body.orden != null) {
    fields.push("orden = ?");
    params.push(Number(body.orden));
  }
  if (body.activo != null) {
    fields.push("activo = ?");
    params.push(body.activo ? 1 : 0);
  }
  if (!fields.length) return;
  params.push(id_valor, id_tienda);
  const [r] = await connection.query(
    `UPDATE ecom_atributo_valor SET ${fields.join(", ")} WHERE id_valor = ? AND id_tienda = ?`,
    params
  );
  if (!r.affectedRows) throw Object.assign(new Error("Valor no encontrado."), { status: 404 });
}

export async function deleteValor(connection, id_tienda, id_valor) {
  const [r] = await connection.query(
    `DELETE FROM ecom_atributo_valor WHERE id_valor = ? AND id_tienda = ?`,
    [id_valor, id_tienda]
  );
  if (!r.affectedRows) throw Object.assign(new Error("Valor no encontrado."), { status: 404 });
}

export async function listProductosDeAtributo(connection, id_tienda, id_atributo) {
  const [rows] = await connection.query(
    `SELECT p.id_producto, p.nombre, p.sku, p.activo
     FROM ecom_producto_atributo pa
     JOIN producto p ON p.id_producto = pa.id_producto AND p.id_tienda = pa.id_tienda
     WHERE pa.id_tienda = ? AND pa.id_atributo = ?
     ORDER BY p.nombre`,
    [id_tienda, id_atributo]
  );
  return rows;
}

export async function getProductoAtributos(connection, id_tienda, id_producto) {
  const [[prodRow]] = await connection.query(
    `SELECT attrs_json FROM producto WHERE id_producto = ? AND id_tienda = ? LIMIT 1`,
    [id_producto, id_tienda]
  );
  const attrsJson = parseJson(prodRow?.attrs_json) || {};
  const inventarioExplicito = Array.isArray(attrsJson.inventario_atributos);

  const [pas] = await connection.query(
    `SELECT pa.*, a.nombre, a.codigo, a.tipo, a.es_variante, a.activo AS attr_activo
     FROM ecom_producto_atributo pa
     JOIN ecom_atributo a ON a.id_atributo = pa.id_atributo AND a.id_tienda = pa.id_tienda
     WHERE pa.id_tienda = ? AND pa.id_producto = ?
     ORDER BY pa.orden ASC, a.orden ASC`,
    [id_tienda, id_producto]
  );
  if (!pas.length) return [];
  const paIds = pas.map((p) => p.id_prod_attr);
  const [pvals] = await connection.query(
    `SELECT pav.*, av.valor, av.hex
     FROM ecom_producto_atributo_valor pav
     LEFT JOIN ecom_atributo_valor av ON av.id_valor = pav.id_valor
     WHERE pav.id_prod_attr IN (?) AND pav.id_tienda = ?`,
    [paIds, id_tienda]
  );
  const byPa = new Map();
  for (const v of pvals) {
    if (!byPa.has(v.id_prod_attr)) byPa.set(v.id_prod_attr, []);
    byPa.get(v.id_prod_attr).push({
      id_valor: v.id_valor,
      valor: v.valor || v.valor_texto,
      hex: v.hex || null,
      valor_texto: v.valor_texto,
    });
  }
  const inventarioIds = inventarioExplicito
    ? attrsJson.inventario_atributos.map(Number).filter(Boolean)
    : [];

  return pas.map((pa) => ({
    id_prod_attr: pa.id_prod_attr,
    id_atributo: pa.id_atributo,
    nombre: pa.nombre,
    codigo: pa.codigo,
    tipo: pa.tipo,
    es_variante: Boolean(pa.es_variante),
    controla_inventario: inventarioIds.includes(pa.id_atributo),
    visible_storefront: Boolean(pa.visible_storefront),
    requiere_seleccion: Boolean(pa.requiere_seleccion),
    obligatorio: Boolean(pa.obligatorio),
    valor_fijo: pa.valor_fijo,
    orden: Number(pa.orden || 0),
    valores: byPa.get(pa.id_prod_attr) || [],
  }));
}

export async function setProductoAtributos(connection, id_tienda, id_producto, items) {
  const [[prod]] = await connection.query(
    `SELECT id_producto, sku FROM producto WHERE id_producto = ? AND id_tienda = ? LIMIT 1`,
    [id_producto, id_tienda]
  );
  if (!prod) throw Object.assign(new Error("Producto no encontrado."), { status: 404 });

  await connection.query(
    `DELETE FROM ecom_producto_atributo WHERE id_producto = ? AND id_tienda = ?`,
    [id_producto, id_tienda]
  );

  const attrMeta = new Map();
  let orden = 0;
  for (const item of items || []) {
    const id_atributo = Number(item.id_atributo);
    if (!id_atributo) continue;
    const [[attr]] = await connection.query(
      `SELECT id_atributo, codigo, nombre, tipo, es_variante FROM ecom_atributo
       WHERE id_atributo = ? AND id_tienda = ? LIMIT 1`,
      [id_atributo, id_tienda]
    );
    if (!attr) continue;
    attrMeta.set(id_atributo, attr);
    const requiere = item.requiere_seleccion ? 1 : attr.es_variante ? 1 : 0;
    const obligatorio = item.obligatorio != null ? (item.obligatorio ? 1 : 0) : requiere;
    const [ins] = await connection.query(
      `INSERT INTO ecom_producto_atributo
        (id_producto, id_atributo, id_tienda, visible_storefront, requiere_seleccion, obligatorio, valor_fijo, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_producto,
        id_atributo,
        id_tienda,
        item.visible_storefront === false ? 0 : 1,
        requiere,
        obligatorio,
        item.valor_fijo || null,
        item.orden != null ? Number(item.orden) : orden,
      ]
    );
    orden += 10;
    const idsValor = Array.isArray(item.id_valores) ? item.id_valores : [];
    for (const idv of idsValor) {
      await connection.query(
        `INSERT INTO ecom_producto_atributo_valor (id_prod_attr, id_valor, id_tienda)
         VALUES (?, ?, ?)`,
        [ins.insertId, Number(idv), id_tienda]
      );
    }
  }

  const inventarioAtributos = [];
  for (const item of items || []) {
    const id_atributo = Number(item.id_atributo);
    const attr = attrMeta.get(id_atributo);
    if (!attr?.es_variante) continue;
    if (resolveControlaInventario(item, attr)) inventarioAtributos.push(id_atributo);
  }
  await persistInventarioAtributos(connection, id_tienda, id_producto, inventarioAtributos);

  await syncVariantesProducto(connection, id_tienda, id_producto);
  await syncProductoAttrsJsonFromEcom(connection, id_tienda, id_producto);
  return getProductoAtributos(connection, id_tienda, id_producto);
}

/** Mantiene producto.attrs_json.atributos alineado con ecom_producto_atributo (vitrina admin). */
export async function syncProductoAttrsJsonFromEcom(connection, id_tienda, id_producto) {
  const attrs = await getProductoAtributos(connection, id_tienda, id_producto);
  const [[row]] = await connection.query(
    `SELECT attrs_json FROM producto WHERE id_producto = ? AND id_tienda = ? LIMIT 1`,
    [id_producto, id_tienda]
  );
  const current = parseJson(row?.attrs_json) || {};

  let talla = [];
  let tonalidad = [];
  for (const a of attrs) {
    if (!a.visible_storefront) continue;
    if (codigoEsTalla(a.codigo, a.nombre)) {
      talla = (a.valores || [])
        .map((v) => String(v.valor || "").trim())
        .filter(Boolean);
    } else if (codigoEsTonalidad(a.codigo, a.nombre, a.tipo)) {
      tonalidad = (a.valores || [])
        .map((v) => ({
          nombre: String(v.valor || "").trim(),
          hex: normalizeHex(v.hex),
        }))
        .filter((t) => t.nombre);
    }
  }

  const prev =
    current.atributos && typeof current.atributos === "object"
      ? { ...current.atributos }
      : {};
  delete prev.color;

  const next = {
    ...current,
    atributos: {
      ...prev,
      talla,
      tonalidad,
    },
  };
  if (Array.isArray(current.inventario_atributos)) {
    next.inventario_atributos = current.inventario_atributos;
  }

  await connection.query(
    `UPDATE producto SET attrs_json = ? WHERE id_producto = ? AND id_tienda = ?`,
    [JSON.stringify(next), id_producto, id_tienda]
  );
}

export async function syncVariantesProducto(connection, id_tienda, id_producto) {
  const attrs = await getProductoAtributos(connection, id_tienda, id_producto);
  const inventarioIds = await readInventarioAtributoIds(connection, id_tienda, id_producto, attrs);
  const variantAttrs = attrs.filter(
    (a) =>
      inventarioIds.includes(a.id_atributo) &&
      (a.tipo === "seleccion" || a.tipo === "color") &&
      a.valores.length
  );

  const [[prod]] = await connection.query(
    `SELECT sku FROM producto WHERE id_producto = ? AND id_tienda = ? LIMIT 1`,
    [id_producto, id_tienda]
  );
  const baseSku = prod?.sku || `P-${id_producto}`;

  const [sucursales] = await connection.query(
    `SELECT id_sucursal FROM ecom_sucursal WHERE id_tienda = ? AND activo = 1`,
    [id_tienda]
  );

  if (!variantAttrs.length) {
    const [existing] = await connection.query(
      `SELECT id_variante, attrs_json, activo FROM ecom_variante
       WHERE id_producto = ? AND id_tienda = ?`,
      [id_producto, id_tienda]
    );
    let defaultId = null;
    for (const v of existing) {
      const json = parseJson(v.attrs_json);
      if (!json || !Object.keys(json).length) {
        defaultId = v.id_variante;
        if (!v.activo) {
          await connection.query(
            `UPDATE ecom_variante SET activo = 1, talla = NULL, color = NULL, attrs_json = NULL
             WHERE id_variante = ? AND id_tienda = ?`,
            [v.id_variante, id_tienda]
          );
        }
        continue;
      }
      await connection.query(
        `UPDATE ecom_variante SET activo = 0 WHERE id_variante = ? AND id_tienda = ?`,
        [v.id_variante, id_tienda]
      );
    }
    if (!defaultId) {
      const [ins] = await connection.query(
        `INSERT INTO ecom_variante (id_tienda, id_producto, sku, attrs_json, activo)
         VALUES (?, ?, ?, NULL, 1)`,
        [id_tienda, id_producto, baseSku]
      );
      defaultId = ins.insertId;
    }
    await ensureInvForVariante(connection, id_tienda, defaultId, sucursales);
    return;
  }

  const lists = variantAttrs.map((a) =>
    a.valores.filter((v) => v.id_valor).map((v) => ({
      id_atributo: a.id_atributo,
      id_valor: v.id_valor,
      valor: v.valor,
      hex: v.hex,
      codigo: a.codigo,
    }))
  );
  const combos = cartesian(lists);

  const comboKey = (parts) =>
    parts
      .map((p) => `${p.id_atributo}:${p.id_valor}`)
      .sort()
      .join("|");

  const [existing] = await connection.query(
    `SELECT id_variante, attrs_json, activo FROM ecom_variante
     WHERE id_producto = ? AND id_tienda = ?`,
    [id_producto, id_tienda]
  );
  const byKey = new Map();
  for (const v of existing) {
    const json = parseJson(v.attrs_json);
    if (!json || typeof json !== "object") continue;
    const parts = Object.entries(json).map(([k, val]) => `${k}:${val}`);
    byKey.set(parts.sort().join("|"), v);
  }

  const keep = new Set();
  for (const combo of combos) {
    const key = comboKey(combo);
    keep.add(key);
    const attrsJson = {};
    const labels = [];
    let talla = null;
    let color = null;
    for (const p of combo) {
      attrsJson[String(p.id_atributo)] = p.id_valor;
      labels.push(p.valor);
      if (p.codigo === "talla") talla = p.valor;
      if (p.codigo === "tonalidad" || p.codigo === "color") color = p.valor;
    }
    const sku = `${baseSku}-${labels.map((l) => slugifyCodigo(l)).join("-")}`.slice(0, 64);
    const found = byKey.get(key);
    if (found) {
      await connection.query(
        `UPDATE ecom_variante SET sku = ?, talla = ?, color = ?, attrs_json = ?, activo = 1
         WHERE id_variante = ? AND id_tienda = ?`,
        [sku, talla, color, JSON.stringify(attrsJson), found.id_variante, id_tienda]
      );
      await ensureInvForVariante(connection, id_tienda, found.id_variante, sucursales);
    } else {
      const [ins] = await connection.query(
        `INSERT INTO ecom_variante (id_tienda, id_producto, sku, talla, color, attrs_json, activo)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [id_tienda, id_producto, sku, talla, color, JSON.stringify(attrsJson)]
      );
      await ensureInvForVariante(connection, id_tienda, ins.insertId, sucursales);
    }
  }

  for (const v of existing) {
    const json = parseJson(v.attrs_json);
    if (!json) {
      await connection.query(
        `UPDATE ecom_variante SET activo = 0 WHERE id_variante = ? AND id_tienda = ?`,
        [v.id_variante, id_tienda]
      );
      continue;
    }
    const key = Object.entries(json)
      .map(([k, val]) => `${k}:${val}`)
      .sort()
      .join("|");
    if (!keep.has(key)) {
      await connection.query(
        `UPDATE ecom_variante SET activo = 0 WHERE id_variante = ? AND id_tienda = ?`,
        [v.id_variante, id_tienda]
      );
    }
  }
}

async function ensureInvForVariante(connection, id_tienda, id_variante, sucursales) {
  for (const s of sucursales) {
    const [[ex]] = await connection.query(
      `SELECT id_inventario FROM ecom_inventario
       WHERE id_tienda = ? AND id_variante = ? AND id_sucursal = ? LIMIT 1`,
      [id_tienda, id_variante, s.id_sucursal]
    );
    if (ex) continue;
    await connection.query(
      `INSERT INTO ecom_inventario
        (id_tienda, id_variante, id_sucursal, stock_fisico, reservado, comprometido, en_transito, stock_min)
       VALUES (?, ?, ?, 0, 0, 0, 0, 5)`,
      [id_tienda, id_variante, s.id_sucursal]
    );
  }
}

export async function resolveVarianteYSnapshot(connection, id_tienda, id_producto, selecciones = []) {
  const defs = await getProductoAtributos(connection, id_tienda, id_producto);
  const selMap = new Map();
  for (const s of selecciones || []) {
    if (s?.id_atributo) selMap.set(Number(s.id_atributo), s);
  }

  const snapshot = [];
  for (const d of defs) {
    const sel = selMap.get(d.id_atributo);
    if (d.requiere_seleccion && d.obligatorio && !sel && !d.valor_fijo) {
      throw Object.assign(new Error(`Selecciona ${d.nombre}.`), { status: 400 });
    }
    let valor = d.valor_fijo;
    let hex = null;
    let id_valor = sel?.id_valor || null;
    if (sel) {
      if (id_valor) {
        const found = d.valores.find((v) => Number(v.id_valor) === Number(id_valor));
        if (!found && d.valores.length) {
          throw Object.assign(new Error(`Valor inválido para ${d.nombre}.`), { status: 400 });
        }
        valor = found?.valor || sel.valor;
        hex = found?.hex || null;
      } else if (sel.valor != null && sel.valor !== "") {
        valor = String(sel.valor);
      }
    }
    if (d.visible_storefront || d.requiere_seleccion) {
      if (valor != null && valor !== "") {
        snapshot.push({
          id_atributo: d.id_atributo,
          nombre: d.nombre,
          tipo: d.tipo,
          valor,
          hex,
          id_valor: id_valor || null,
        });
      }
    }
  }

  const inventarioIds = await readInventarioAtributoIds(connection, id_tienda, id_producto, defs);
  const variantDefs = defs.filter((d) => inventarioIds.includes(d.id_atributo));
  let id_variante = null;
  if (variantDefs.length) {
    const wanted = {};
    for (const d of variantDefs) {
      const sel = selMap.get(d.id_atributo);
      const idv = sel?.id_valor;
      if (!idv) {
        throw Object.assign(new Error(`Selecciona ${d.nombre}.`), { status: 400 });
      }
      wanted[String(d.id_atributo)] = Number(idv);
    }
    const [vars] = await connection.query(
      `SELECT id_variante, attrs_json, color, talla FROM ecom_variante
       WHERE id_producto = ? AND id_tienda = ? AND activo = 1`,
      [id_producto, id_tienda]
    );
    const withAttrs = [];
    for (const v of vars) {
      const json = parseJson(v.attrs_json) || {};
      if (json && typeof json === "object" && Object.keys(json).length) {
        withAttrs.push(v);
        const ok = Object.entries(wanted).every(
          ([k, val]) => Number(json[k]) === Number(val)
        );
        if (ok) {
          id_variante = v.id_variante;
          break;
        }
      }
    }
    // Atributo marcado es_variante pero aún no hay cartesianas: usar variante default (stock global).
    if (!id_variante && withAttrs.length === 0 && vars.length) {
      id_variante = vars[0].id_variante;
    }
    if (!id_variante) {
      throw Object.assign(new Error("Combinación no disponible."), { status: 400 });
    }
  } else {
    const [[def]] = await connection.query(
      `SELECT id_variante FROM ecom_variante
       WHERE id_producto = ? AND id_tienda = ? AND activo = 1
       ORDER BY id_variante ASC LIMIT 1`,
      [id_producto, id_tienda]
    );
    id_variante = def?.id_variante || null;
  }

  return { id_variante, attrs_snapshot: snapshot };
}

export async function getStorefrontProductoAttrs(connection, id_tienda, id_producto) {
  const defs = await getProductoAtributos(connection, id_tienda, id_producto);
  const [vars] = await connection.query(
    `SELECT id_variante, sku, talla, color, attrs_json, precio_override, activo
     FROM ecom_variante WHERE id_producto = ? AND id_tienda = ? AND activo = 1`,
    [id_producto, id_tienda]
  );
  return {
    atributos: defs.filter((d) => d.visible_storefront || d.requiere_seleccion),
    variantes: vars.map((v) => ({
      id_variante: v.id_variante,
      sku: v.sku,
      talla: v.talla,
      color: v.color,
      attrs: parseJson(v.attrs_json),
      precio_override: v.precio_override,
    })),
  };
}
