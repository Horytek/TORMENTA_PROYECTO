/**
 * Catálogo por tienda: marca, categoría y tag.
 * Los productos siguen guardando el nombre (producto.categoria / attrs_json).
 */

export const TAXONOMIA_TIPOS = ["marca", "categoria", "tag"];

function parseJson(v) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function normNombre(raw) {
  return String(raw || "").trim().slice(0, 80);
}

export function mapTermino(row) {
  if (!row) return null;
  return {
    id_termino: row.id_termino,
    tipo: row.tipo,
    nombre: row.nombre,
    activo: Boolean(row.activo),
    orden: Number(row.orden || 0),
  };
}

export async function listTerminos(connection, id_tienda, { tipo, q, activo } = {}) {
  let sql = `SELECT * FROM ecom_taxonomia WHERE id_tienda = ?`;
  const params = [id_tienda];
  if (tipo && TAXONOMIA_TIPOS.includes(tipo)) {
    sql += ` AND tipo = ?`;
    params.push(tipo);
  }
  if (activo === "1" || activo === "0") {
    sql += ` AND activo = ?`;
    params.push(Number(activo));
  }
  if (q && String(q).trim()) {
    sql += ` AND nombre LIKE ?`;
    params.push(`%${String(q).trim()}%`);
  }
  sql += ` ORDER BY orden ASC, nombre ASC`;
  const [rows] = await connection.query(sql, params);
  return rows.map(mapTermino);
}

export async function getTermino(connection, id_tienda, id_termino) {
  const [[row]] = await connection.query(
    `SELECT * FROM ecom_taxonomia WHERE id_termino = ? AND id_tienda = ? LIMIT 1`,
    [id_termino, id_tienda]
  );
  return mapTermino(row);
}

export async function createTermino(connection, id_tienda, body) {
  const tipo = String(body.tipo || "");
  if (!TAXONOMIA_TIPOS.includes(tipo)) {
    throw Object.assign(new Error("Tipo inválido."), { status: 400 });
  }
  const nombre = normNombre(body.nombre);
  if (!nombre) throw Object.assign(new Error("Nombre requerido."), { status: 400 });

  const [[max]] = await connection.query(
    `SELECT COALESCE(MAX(orden), 0) AS m FROM ecom_taxonomia WHERE id_tienda = ? AND tipo = ?`,
    [id_tienda, tipo]
  );
  try {
    const [ins] = await connection.query(
      `INSERT INTO ecom_taxonomia (id_tienda, tipo, nombre, activo, orden)
       VALUES (?, ?, ?, ?, ?)`,
      [id_tienda, tipo, nombre, body.activo === false ? 0 : 1, Number(max.m) + 10]
    );
    return getTermino(connection, id_tienda, ins.insertId);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw Object.assign(new Error("Ya existe ese valor."), { status: 409 });
    }
    throw err;
  }
}

/** Crea o reactiva el término. Útil al elegir «Crear …» desde el select. */
export async function ensureTermino(connection, id_tienda, body) {
  const tipo = String(body.tipo || "");
  const nombre = normNombre(body.nombre);
  if (!TAXONOMIA_TIPOS.includes(tipo) || !nombre) {
    return createTermino(connection, id_tienda, body);
  }
  const [[row]] = await connection.query(
    `SELECT * FROM ecom_taxonomia WHERE id_tienda = ? AND tipo = ? AND nombre = ? LIMIT 1`,
    [id_tienda, tipo, nombre]
  );
  if (!row) return createTermino(connection, id_tienda, { tipo, nombre });
  if (!row.activo) {
    await connection.query(
      `UPDATE ecom_taxonomia SET activo = 1 WHERE id_termino = ? AND id_tienda = ?`,
      [row.id_termino, id_tienda]
    );
  }
  return getTermino(connection, id_tienda, row.id_termino);
}

async function renameEnProductos(connection, id_tienda, tipo, oldName, newName) {
  if (!oldName || oldName === newName) return;
  if (tipo === "categoria") {
    await connection.query(
      `UPDATE producto SET categoria = ? WHERE id_tienda = ? AND categoria = ?`,
      [newName, id_tienda, oldName]
    );
    return;
  }
  const [rows] = await connection.query(
    `SELECT id_producto, attrs_json FROM producto WHERE id_tienda = ? AND attrs_json IS NOT NULL`,
    [id_tienda]
  );
  for (const r of rows) {
    const attrs = parseJson(r.attrs_json);
    if (!attrs || typeof attrs !== "object") continue;
    let changed = false;
    if (tipo === "marca" && attrs.marca === oldName) {
      attrs.marca = newName;
      changed = true;
    }
    if (tipo === "tag" && Array.isArray(attrs.tags)) {
      const next = attrs.tags.map((t) => (t === oldName ? newName : t));
      if (next.some((t, i) => t !== attrs.tags[i])) {
        attrs.tags = next;
        changed = true;
      }
    }
    if (!changed) continue;
    await connection.query(
      `UPDATE producto SET attrs_json = ? WHERE id_producto = ? AND id_tienda = ?`,
      [JSON.stringify(attrs), r.id_producto, id_tienda]
    );
  }
}

export async function updateTermino(connection, id_tienda, id_termino, body) {
  const existing = await getTermino(connection, id_tienda, id_termino);
  if (!existing) throw Object.assign(new Error("Valor no encontrado."), { status: 404 });

  const fields = [];
  const params = [];
  let newNombre = existing.nombre;
  if (body.nombre != null) {
    newNombre = normNombre(body.nombre);
    if (!newNombre) throw Object.assign(new Error("Nombre requerido."), { status: 400 });
    fields.push("nombre = ?");
    params.push(newNombre);
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
    params.push(id_termino, id_tienda);
    try {
      await connection.query(
        `UPDATE ecom_taxonomia SET ${fields.join(", ")} WHERE id_termino = ? AND id_tienda = ?`,
        params
      );
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        throw Object.assign(new Error("Ya existe ese valor."), { status: 409 });
      }
      throw err;
    }
  }
  if (newNombre !== existing.nombre) {
    await renameEnProductos(connection, id_tienda, existing.tipo, existing.nombre, newNombre);
  }
  return getTermino(connection, id_tienda, id_termino);
}

export async function deleteTermino(connection, id_tienda, id_termino) {
  const existing = await getTermino(connection, id_tienda, id_termino);
  if (!existing) throw Object.assign(new Error("Valor no encontrado."), { status: 404 });
  await connection.query(
    `DELETE FROM ecom_taxonomia WHERE id_termino = ? AND id_tienda = ?`,
    [id_termino, id_tienda]
  );
}
