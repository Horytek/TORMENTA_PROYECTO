import { asignarCantidad, revertirAsignacion, POLITICA } from "./asignacionStock.js";
import { StockInsuficienteError, SinInventarioError } from "./errores.js";

/**
 * Acceso al stock. Única puerta a `inventario_stock`.
 *
 * Existe porque el stock ya se movió de tabla una vez y el código quedó
 * apuntando a la anterior: `generate_skus.js` migró los datos a
 * `inventario_stock` en enero de 2026 y el commit 35a3d8fb devolvió los
 * controladores a `inventario`, que quedó vacía. Con ~60 consultas sueltas
 * repartidas en ocho controladores, nadie lo notó hasta que el catálogo del POS
 * salió vacío. Centralizar el acceso evita que vuelva a pasar en silencio.
 *
 * Reglas que se respetan en TODAS las consultas:
 *  - `id_tenant` SIEMPRE en el WHERE (Regla de Oro Nº1). El índice único de la
 *    tabla vieja lo omitía y podía sumar stock a la fila de otro tenant.
 *  - La conexión llega desde afuera, para participar de la transacción del
 *    llamador: mover stock y registrar la venta cuadran o fallan juntos.
 *  - Los bloqueos se toman SIEMPRE ordenados por `id_sku` ascendente, para que
 *    dos ventas simultáneas del mismo producto no se traben entre sí.
 */

// ─────────────────────────────── Lectura ───────────────────────────────

/**
 * Stock agregado por producto. Una sola consulta para todos los productos
 * pedidos: el catálogo del POS son ~120 productos y no puede hacer 120 viajes.
 *
 * @returns {Promise<Map<number, number>>} id_producto → unidades
 */
export const stockPorProducto = async (cx, { id_tenant, id_almacen = null, ids_producto = null }) => {
  const where = ["s.id_tenant = ?"];
  const params = [id_tenant];

  if (id_almacen) { where.push("s.id_almacen = ?"); params.push(id_almacen); }
  if (Array.isArray(ids_producto) && ids_producto.length > 0) {
    where.push(`ps.id_producto IN (${ids_producto.map(() => "?").join(",")})`);
    params.push(...ids_producto);
  }

  const [filas] = await cx.query(
    `SELECT ps.id_producto, COALESCE(SUM(s.stock), 0) AS stock
     FROM inventario_stock s
     INNER JOIN producto_sku ps ON ps.id_sku = s.id_sku AND ps.id_tenant = s.id_tenant
     WHERE ${where.join(" AND ")}
     GROUP BY ps.id_producto`,
    params
  );

  return new Map(filas.map((f) => [Number(f.id_producto), Number(f.stock)]));
};

/** Stock de un SKU concreto en un almacén. */
export const stockPorSku = async (cx, { id_tenant, id_sku, id_almacen }) => {
  const [[fila]] = await cx.query(
    `SELECT stock, reservado FROM inventario_stock
     WHERE id_tenant = ? AND id_sku = ? AND id_almacen = ? LIMIT 1`,
    [id_tenant, id_sku, id_almacen]
  );
  return fila ? { stock: Number(fila.stock), reservado: Number(fila.reservado) } : null;
};

/**
 * Filas de stock de un producto, con su descripción de SKU.
 * Alimenta el modal de variantes y el reparto.
 */
export const filasDeProducto = async (cx, { id_tenant, id_producto, id_almacen = null, soloConStock = false }) => {
  const where = ["s.id_tenant = ?", "ps.id_producto = ?"];
  const params = [id_tenant, id_producto];
  if (id_almacen) { where.push("s.id_almacen = ?"); params.push(id_almacen); }
  if (soloConStock) where.push("s.stock > 0");

  const [filas] = await cx.query(
    `SELECT s.id_sku, s.id_almacen, s.stock, s.reservado, ps.sku, ps.cod_barras, ps.attributes_json
     FROM inventario_stock s
     INNER JOIN producto_sku ps ON ps.id_sku = s.id_sku AND ps.id_tenant = s.id_tenant
     WHERE ${where.join(" AND ")}
     ORDER BY s.id_sku`,
    params
  );
  return filas.map((f) => ({ ...f, stock: Number(f.stock), reservado: Number(f.reservado) }));
};

/**
 * ¿El almacén tiene stock registrado?
 *
 * La usa `almacen.controller.js` para decidir entre baja lógica y borrado
 * físico. Con la consulta apuntando a la tabla vacía, un almacén con
 * existencias se consideraba "sin uso" y se borraba de verdad.
 */
export const almacenTieneStock = async (cx, { id_tenant, id_almacen }) => {
  const [[fila]] = await cx.query(
    `SELECT 1 AS hay FROM inventario_stock
     WHERE id_tenant = ? AND id_almacen = ? AND stock <> 0 LIMIT 1`,
    [id_tenant, id_almacen]
  );
  return Boolean(fila);
};

// ─────────────────────────────── Escritura ───────────────────────────────

/**
 * Suma stock a un SKU, creando la fila si no existía.
 *
 * El `ON DUPLICATE KEY UPDATE` funciona porque `uq_stock_sku_alm` es
 * (id_tenant, id_sku, id_almacen), las tres NOT NULL. En la tabla vieja el
 * índice incluía `id_tonalidad`/`id_talla`, que admiten NULL: MySQL considera
 * cada NULL distinto, así que nunca colisionaba y creaba filas duplicadas.
 */
export const sumarStockSku = async (cx, { id_tenant, id_sku, id_almacen, cantidad }) => {
  const unidades = Number(cantidad);
  if (!Number.isInteger(unidades) || unidades <= 0) {
    throw new Error(`sumarStockSku: cantidad inválida (${cantidad}).`);
  }

  const antes = await stockPorSku(cx, { id_tenant, id_sku, id_almacen });
  await cx.query(
    `INSERT INTO inventario_stock (id_tenant, id_sku, id_almacen, stock, reservado)
     VALUES (?, ?, ?, ?, 0)
     ON DUPLICATE KEY UPDATE stock = stock + VALUES(stock)`,
    [id_tenant, id_sku, id_almacen, unidades]
  );

  const stockAnterior = antes?.stock ?? 0;
  return { id_sku, stockAnterior, stockActual: stockAnterior + unidades };
};

/**
 * Resta stock de un SKU. Falla si no alcanza, sin dejar el stock negativo.
 *
 * El `AND stock >= ?` hace la comprobación y el descuento en la MISMA sentencia:
 * entre un SELECT y un UPDATE separados cabe otra venta, y ahí es donde
 * aparecen las sobreventas.
 */
export const restarStockSku = async (cx, { id_tenant, id_sku, id_almacen, cantidad }) => {
  const unidades = Number(cantidad);
  if (!Number.isInteger(unidades) || unidades <= 0) {
    throw new Error(`restarStockSku: cantidad inválida (${cantidad}).`);
  }

  const [resultado] = await cx.query(
    `UPDATE inventario_stock SET stock = stock - ?
     WHERE id_tenant = ? AND id_sku = ? AND id_almacen = ? AND stock >= ?`,
    [unidades, id_tenant, id_sku, id_almacen, unidades]
  );

  if (resultado.affectedRows === 0) {
    const actual = await stockPorSku(cx, { id_tenant, id_sku, id_almacen });
    throw new StockInsuficienteError({
      id_sku, id_almacen, disponible: actual?.stock ?? 0, solicitado: unidades,
    });
  }

  const stockAnterior = (await stockPorSku(cx, { id_tenant, id_sku, id_almacen })).stock + unidades;
  return { id_sku, stockAnterior, stockActual: stockAnterior - unidades };
};

/**
 * Descuenta una cantidad de un PRODUCTO, repartiéndola entre sus SKU.
 *
 * Es el camino del POS, que hoy vende sin elegir variante. Bloquea las filas
 * candidatas antes de decidir, para que el reparto se calcule sobre valores que
 * nadie va a cambiar a mitad de la operación.
 *
 * @returns {Promise<Array<{id_sku, cantidad, stockAnterior, stockActual}>>}
 */
export const descontarPorProducto = async (
  cx,
  { id_tenant, id_producto, id_almacen, cantidad, politica = POLITICA.CONCENTRAR, descripcion = null }
) => {
  // FOR UPDATE ordenado por id_sku: todas las transacciones toman los bloqueos
  // en el mismo orden, así que no pueden trabarse entre sí.
  const [candidatas] = await cx.query(
    `SELECT s.id_sku, s.stock
     FROM inventario_stock s
     INNER JOIN producto_sku ps ON ps.id_sku = s.id_sku AND ps.id_tenant = s.id_tenant
     WHERE s.id_tenant = ? AND ps.id_producto = ? AND s.id_almacen = ?
     ORDER BY s.id_sku
     FOR UPDATE`,
    [id_tenant, id_producto, id_almacen]
  );

  if (candidatas.length === 0) {
    throw new SinInventarioError({ id_producto, id_almacen, descripcion });
  }

  const { asignaciones, faltante, disponibleTotal } = asignarCantidad({
    disponibles: candidatas, cantidad, politica,
  });

  if (faltante > 0) {
    throw new StockInsuficienteError({
      id_producto, id_almacen, disponible: disponibleTotal, solicitado: Number(cantidad), descripcion,
    });
  }

  const movimientos = [];
  for (const a of asignaciones) {
    movimientos.push(await restarStockSku(cx, { id_tenant, id_sku: a.id_sku, id_almacen, cantidad: a.cantidad }));
  }
  return movimientos.map((m, i) => ({ ...m, cantidad: asignaciones[i].cantidad }));
};

/**
 * Reaplica un reparto conocido devolviendo el stock. Se usa al anular: la
 * bitácora guarda de qué SKU salió cada unidad, así que vuelven al mismo sitio
 * en vez de a una fila arbitraria.
 */
export const devolverAsignaciones = async (cx, { id_tenant, id_almacen, asignaciones }) => {
  const movimientos = [];
  for (const a of revertirAsignacion(asignaciones)) {
    movimientos.push(await sumarStockSku(cx, { id_tenant, id_sku: a.id_sku, id_almacen, cantidad: a.cantidad }));
  }
  return movimientos;
};

export default {
  stockPorProducto,
  stockPorSku,
  filasDeProducto,
  almacenTieneStock,
  sumarStockSku,
  restarStockSku,
  descontarPorProducto,
  devolverAsignaciones,
};
