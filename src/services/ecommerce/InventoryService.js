/**
 * Inventario ecommerce por variante + sucursal.
 * disponible = stock_fisico - reservado - comprometido
 */

export function calcDisponible(inv) {
  const fisico = Number(inv?.stock_fisico ?? 0);
  const reservado = Number(inv?.reservado ?? 0);
  const comprometido = Number(inv?.comprometido ?? 0);
  return Math.max(0, fisico - reservado - comprometido);
}

export async function getInventario(connection, id_tienda, id_variante, id_sucursal, forUpdate = false) {
  const lock = forUpdate ? " FOR UPDATE" : "";
  const [[row]] = await connection.query(
    `SELECT * FROM ecom_inventario
     WHERE id_tienda = ? AND id_variante = ? AND id_sucursal = ?${lock}`,
    [id_tienda, id_variante, id_sucursal]
  );
  return row || null;
}

export async function registrarMovimiento(
  connection,
  { id_tienda, id_variante, id_sucursal, tipo, cantidad, stock_antes, stock_despues, id_usuario, motivo, ref_tipo, ref_id }
) {
  await connection.query(
    `INSERT INTO ecom_inventario_mov
      (id_tienda, id_variante, id_sucursal, tipo, cantidad, stock_antes, stock_despues, id_usuario, motivo, ref_tipo, ref_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_tienda,
      id_variante,
      id_sucursal,
      tipo,
      cantidad,
      stock_antes ?? null,
      stock_despues ?? null,
      id_usuario ?? null,
      motivo ?? null,
      ref_tipo ?? null,
      ref_id ?? null,
    ]
  );
}

export async function reservarStock(connection, { id_tienda, id_variante, id_sucursal, cantidad, ref_tipo, ref_id }) {
  const inv = await getInventario(connection, id_tienda, id_variante, id_sucursal, true);
  if (!inv) {
    throw Object.assign(new Error("Sin inventario en esta sucursal."), { status: 400 });
  }
  const disponible = calcDisponible(inv);
  if (disponible < cantidad) {
    throw Object.assign(new Error("Stock insuficiente en sucursal."), { status: 400 });
  }
  const stock_antes = Number(inv.reservado);
  const stock_despues = stock_antes + cantidad;
  await connection.query(
    `UPDATE ecom_inventario SET reservado = ? WHERE id_inventario = ? AND id_tienda = ?`,
    [stock_despues, inv.id_inventario, id_tienda]
  );
  await registrarMovimiento(connection, {
    id_tienda,
    id_variante,
    id_sucursal,
    tipo: "reserva",
    cantidad,
    stock_antes,
    stock_despues,
    motivo: "Reserva checkout",
    ref_tipo,
    ref_id,
  });
}

export async function liberarReserva(connection, { id_tienda, id_variante, id_sucursal, cantidad, ref_tipo, ref_id }) {
  const inv = await getInventario(connection, id_tienda, id_variante, id_sucursal, true);
  if (!inv) return;
  const stock_antes = Number(inv.reservado);
  const stock_despues = Math.max(0, stock_antes - cantidad);
  await connection.query(
    `UPDATE ecom_inventario SET reservado = ? WHERE id_inventario = ? AND id_tienda = ?`,
    [stock_despues, inv.id_inventario, id_tienda]
  );
  await registrarMovimiento(connection, {
    id_tienda,
    id_variante,
    id_sucursal,
    tipo: "liberacion",
    cantidad,
    stock_antes,
    stock_despues,
    motivo: "Liberación reserva",
    ref_tipo,
    ref_id,
  });
}

export async function confirmarVenta(connection, { id_tienda, id_variante, id_sucursal, cantidad, ref_tipo, ref_id }) {
  const inv = await getInventario(connection, id_tienda, id_variante, id_sucursal, true);
  if (!inv) return;
  const resAntes = Number(inv.reservado);
  const resDespues = Math.max(0, resAntes - cantidad);
  const fisAntes = Number(inv.stock_fisico);
  const fisDespues = Math.max(0, fisAntes - cantidad);
  await connection.query(
    `UPDATE ecom_inventario SET reservado = ?, stock_fisico = ? WHERE id_inventario = ? AND id_tienda = ?`,
    [resDespues, fisDespues, inv.id_inventario, id_tienda]
  );
  await registrarMovimiento(connection, {
    id_tienda,
    id_variante,
    id_sucursal,
    tipo: "venta",
    cantidad,
    stock_antes: fisAntes,
    stock_despues: fisDespues,
    motivo: "Venta aprobada",
    ref_tipo,
    ref_id,
  });
}

export async function getStockPorProductoSucursal(connection, id_tienda, id_producto, id_sucursal) {
  const [rows] = await connection.query(
    `SELECT v.id_variante, v.sku, v.talla, v.color,
            i.stock_fisico, i.reservado, i.comprometido
     FROM ecom_variante v
     LEFT JOIN ecom_inventario i ON i.id_variante = v.id_variante AND i.id_sucursal = ? AND i.id_tienda = ?
     WHERE v.id_producto = ? AND v.id_tienda = ? AND v.activo = 1`,
    [id_sucursal, id_tienda, id_producto, id_tienda]
  );
  return rows.map((r) => ({
    ...r,
    disponible: calcDisponible(r),
  }));
}

export async function getStockTotalProducto(connection, id_tienda, id_producto, id_sucursal = null) {
  let sql = `
    SELECT COALESCE(SUM(GREATEST(0, i.stock_fisico - i.reservado - i.comprometido)), 0) AS disponible
    FROM ecom_variante v
    JOIN ecom_inventario i ON i.id_variante = v.id_variante AND i.id_tienda = v.id_tienda
    WHERE v.id_producto = ? AND v.id_tienda = ? AND v.activo = 1`;
  const params = [id_producto, id_tienda];
  if (id_sucursal) {
    sql += ` AND i.id_sucursal = ?`;
    params.push(id_sucursal);
  }
  const [[row]] = await connection.query(sql, params);
  return Number(row?.disponible ?? 0);
}

/** Stock disponible agregado por producto (1 query para todo el catálogo). */
export async function getStockMapPorProductos(connection, id_tienda, id_sucursal = null) {
  let sql = `
    SELECT v.id_producto,
           COALESCE(SUM(GREATEST(0, i.stock_fisico - i.reservado - i.comprometido)), 0) AS disponible
    FROM ecom_variante v
    JOIN ecom_inventario i ON i.id_variante = v.id_variante AND i.id_tienda = v.id_tienda
    WHERE v.id_tienda = ? AND v.activo = 1`;
  const params = [id_tienda];
  if (id_sucursal) {
    sql += ` AND i.id_sucursal = ?`;
    params.push(id_sucursal);
  }
  sql += ` GROUP BY v.id_producto`;
  const [rows] = await connection.query(sql, params);
  return new Map(rows.map((r) => [r.id_producto, Number(r.disponible ?? 0)]));
}

export async function getDefaultVariante(connection, id_tienda, id_producto) {
  const [[v]] = await connection.query(
    `SELECT id_variante, sku FROM ecom_variante
     WHERE id_producto = ? AND id_tienda = ? AND activo = 1
     ORDER BY id_variante ASC LIMIT 1`,
    [id_producto, id_tienda]
  );
  return v || null;
}

export async function ensureDefaultVariante(connection, id_tienda, id_producto, sku = null) {
  let variante = await getDefaultVariante(connection, id_tienda, id_producto);
  if (variante) return variante;
  const [[prod]] = await connection.query(
    `SELECT sku, stock FROM producto WHERE id_producto = ? AND id_tienda = ? LIMIT 1`,
    [id_producto, id_tienda]
  );
  const [ins] = await connection.query(
    `INSERT INTO ecom_variante (id_tienda, id_producto, sku, activo) VALUES (?, ?, ?, 1)`,
    [id_tienda, id_producto, sku || prod?.sku || `P-${id_producto}`]
  );
  return { id_variante: ins.insertId, sku: sku || prod?.sku };
}

/**
 * Asegura 1 variante técnica default + filas ecom_inventario (producto × sucursales activas).
 * Stock inicial: producto.stock en la sucursal default (o la primera), 0 en el resto.
 */
export async function ensureInventarioProducto(connection, id_tienda, id_producto) {
  const [[prod]] = await connection.query(
    `SELECT id_producto, sku, stock FROM producto WHERE id_producto = ? AND id_tienda = ? AND activo = 1 LIMIT 1`,
    [id_producto, id_tienda]
  );
  if (!prod) return null;

  const variante = await ensureDefaultVariante(connection, id_tienda, id_producto, prod.sku);
  const [sucursales] = await connection.query(
    `SELECT id_sucursal, es_default FROM ecom_sucursal
     WHERE id_tienda = ? AND activo = 1
     ORDER BY es_default DESC, id_sucursal ASC`,
    [id_tienda]
  );
  if (!sucursales.length) return { id_variante: variante.id_variante, filas: 0 };

  const stockInicial = Math.max(0, Number(prod.stock) || 0);
  let defaultId = sucursales.find((s) => Number(s.es_default) === 1)?.id_sucursal ?? sucursales[0].id_sucursal;
  let created = 0;

  for (const s of sucursales) {
    const [[exists]] = await connection.query(
      `SELECT id_inventario FROM ecom_inventario
       WHERE id_tienda = ? AND id_variante = ? AND id_sucursal = ? LIMIT 1`,
      [id_tienda, variante.id_variante, s.id_sucursal]
    );
    if (exists) continue;
    const stock = s.id_sucursal === defaultId ? stockInicial : 0;
    await connection.query(
      `INSERT INTO ecom_inventario
        (id_tienda, id_variante, id_sucursal, stock_fisico, reservado, comprometido, en_transito, stock_min)
       VALUES (?, ?, ?, ?, 0, 0, 0, 5)`,
      [id_tienda, variante.id_variante, s.id_sucursal, stock]
    );
    created += 1;
  }
  return { id_variante: variante.id_variante, filas: created };
}

/** Backfill idempotente: todos los productos activos de la tienda. */
export async function ensureInventarioTienda(connection, id_tienda) {
  const [productos] = await connection.query(
    `SELECT id_producto FROM producto WHERE id_tienda = ? AND activo = 1`,
    [id_tienda]
  );
  let productosOk = 0;
  for (const p of productos) {
    await ensureInventarioProducto(connection, id_tienda, p.id_producto);
    productosOk += 1;
  }
  return { productos: productosOk };
}

/** Al activar/crear una sucursal: filas inventario 0 para cada variante default existente. */
export async function ensureInventarioSucursal(connection, id_tienda, id_sucursal) {
  const [variantes] = await connection.query(
    `SELECT v.id_variante
     FROM ecom_variante v
     JOIN producto p ON p.id_producto = v.id_producto AND p.id_tienda = v.id_tienda
     WHERE v.id_tienda = ? AND v.activo = 1 AND p.activo = 1`,
    [id_tienda]
  );
  let created = 0;
  for (const v of variantes) {
    const [[exists]] = await connection.query(
      `SELECT id_inventario FROM ecom_inventario
       WHERE id_tienda = ? AND id_variante = ? AND id_sucursal = ? LIMIT 1`,
      [id_tienda, v.id_variante, id_sucursal]
    );
    if (exists) continue;
    await connection.query(
      `INSERT INTO ecom_inventario
        (id_tienda, id_variante, id_sucursal, stock_fisico, reservado, comprometido, en_transito, stock_min)
       VALUES (?, ?, ?, 0, 0, 0, 0, 5)`,
      [id_tienda, v.id_variante, id_sucursal]
    );
    created += 1;
  }
  return { created };
}
