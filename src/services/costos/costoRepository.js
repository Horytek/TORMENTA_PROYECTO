import { recalcularCostoPromedio, valorizarStock } from "./costoPromedio.js";

/**
 * Persistencia del costo por SKU.
 *
 * Reglas de la casa que se respetan en todas las consultas:
 *  - SQL parametrizado.
 *  - `id_tenant` SIEMPRE en el WHERE (Regla de Oro Nº1).
 *  - El costo se recalcula con la función pura de `costoPromedio.js`; acá solo
 *    se lee el estado y se guarda el resultado.
 *
 * Todas las funciones reciben la conexión desde afuera para poder participar de
 * la transacción de quien las llama: registrar un ingreso y mover el stock
 * tienen que cuadrar o fallar juntos.
 */

/** Stock y costo vigentes de un SKU, que es lo que necesita el promedio ponderado. */
export const obtenerEstadoCosto = async (cx, { id_tenant, id_sku, id_almacen = null }) => {
  const [[sku]] = await cx.query(
    `SELECT id_sku, costo_promedio, costo_ultimo, costo_estimado
     FROM producto_sku WHERE id_sku = ? AND id_tenant = ? LIMIT 1`,
    [id_sku, id_tenant]
  );
  if (!sku) return null;

  // El promedio se pondera contra el stock TOTAL del SKU, no el de un almacén:
  // el costo es del artículo, no del lugar donde está guardado.
  const [[agregado]] = await cx.query(
    `SELECT COALESCE(SUM(stock), 0) AS stock_total
     FROM inventario_stock WHERE id_sku = ? AND id_tenant = ?`,
    [id_sku, id_tenant]
  );

  let stockAlmacen = null;
  if (id_almacen !== null) {
    const [[fila]] = await cx.query(
      `SELECT stock FROM inventario_stock WHERE id_sku = ? AND id_almacen = ? AND id_tenant = ? LIMIT 1`,
      [id_sku, id_almacen, id_tenant]
    );
    stockAlmacen = fila ? Number(fila.stock) : 0;
  }

  return {
    id_sku: sku.id_sku,
    costoPromedio: sku.costo_promedio === null ? null : Number(sku.costo_promedio),
    costoUltimo: sku.costo_ultimo === null ? null : Number(sku.costo_ultimo),
    estimado: Boolean(sku.costo_estimado),
    stockTotal: Number(agregado.stock_total),
    stockAlmacen,
  };
};

/**
 * Aplica un ingreso de mercadería al costo del SKU.
 *
 * IMPORTANTE: hay que llamarla ANTES de sumar el stock del ingreso, porque el
 * promedio pondera contra el stock previo. Si se llama después, la cantidad
 * entrante se cuenta dos veces y el costo queda mal.
 *
 * @returns {{costoPromedio:number, motivo:string, estimado:boolean}|null}
 *          null si el SKU no existe para ese tenant.
 */
export const aplicarIngresoAlCosto = async (cx, { id_tenant, id_sku, cantidad, costoUnitario }) => {
  const estado = await obtenerEstadoCosto(cx, { id_tenant, id_sku });
  if (!estado) return null;

  const resultado = recalcularCostoPromedio({
    stockActual: estado.stockTotal,
    costoActual: estado.costoPromedio,
    cantidadIngreso: cantidad,
    costoIngreso: costoUnitario,
  });

  await cx.query(
    `UPDATE producto_sku
     SET costo_promedio = ?, costo_ultimo = ?, costo_estimado = ?, costo_actualizado_en = NOW()
     WHERE id_sku = ? AND id_tenant = ?`,
    [resultado.costoPromedio, Number(costoUnitario), resultado.estimado ? 1 : 0, id_sku, id_tenant]
  );

  return resultado;
};

/**
 * Costo vigente de varios SKUs, para fotografiarlo al vender.
 * Se resuelve en una consulta y no una por línea: una venta de 20 prendas no
 * debe disparar 20 viajes a la base.
 *
 * @returns {Map<number, number|null>} id_sku → costo promedio (null si no tiene)
 */
export const obtenerCostosVigentes = async (cx, { id_tenant, idsSku }) => {
  const ids = [...new Set((idsSku || []).map(Number).filter(Number.isInteger))];
  if (ids.length === 0) return new Map();

  const [filas] = await cx.query(
    `SELECT id_sku, costo_promedio FROM producto_sku
     WHERE id_tenant = ? AND id_sku IN (${ids.map(() => "?").join(",")})`,
    [id_tenant, ...ids]
  );

  return new Map(
    filas.map((f) => [Number(f.id_sku), f.costo_promedio === null ? null : Number(f.costo_promedio)])
  );
};

/**
 * Valor del inventario del tenant, valorizado al costo promedio.
 * Informa aparte las unidades sin costo: valorizarlas en cero calladamente
 * haría ver el inventario más barato de lo que es.
 */
export const valorizarInventario = async (cx, { id_tenant, id_almacen = null }) => {
  const params = [id_tenant];
  let filtroAlmacen = "";
  if (id_almacen !== null) {
    filtroAlmacen = " AND s.id_almacen = ?";
    params.push(id_almacen);
  }

  const [filas] = await cx.query(
    `SELECT s.id_sku, s.stock, ps.costo_promedio
     FROM inventario_stock s
     INNER JOIN producto_sku ps ON ps.id_sku = s.id_sku AND ps.id_tenant = s.id_tenant
     WHERE s.id_tenant = ? AND s.stock > 0${filtroAlmacen}`,
    params
  );

  let valor = 0;
  let unidadesValorizadas = 0;
  let unidadesSinCosto = 0;
  let skusSinCosto = 0;

  for (const f of filas) {
    const v = valorizarStock({ stock: f.stock, costoPromedio: f.costo_promedio });
    if (v.sinCosto) {
      unidadesSinCosto += v.unidades;
      skusSinCosto += 1;
    } else {
      valor += v.valor;
      unidadesValorizadas += v.unidades;
    }
  }

  const totalUnidades = unidadesValorizadas + unidadesSinCosto;
  return {
    valor: Math.round(valor * 100) / 100,
    unidadesValorizadas,
    unidadesSinCosto,
    skusSinCosto,
    // Qué tan confiable es la cifra: 100% = todo el stock tiene costo conocido.
    cobertura: totalUnidades > 0 ? Math.round((unidadesValorizadas / totalUnidades) * 1000) / 10 : 100,
  };
};

/** Margen de un periodo, calculado contra el costo capturado en cada venta. */
export const obtenerMargenPorPeriodo = async (cx, { id_tenant, desde, hasta }) => {
  const params = [id_tenant];
  let rango = "";
  if (desde) { rango += " AND v.f_venta >= ?"; params.push(desde); }
  if (hasta) { rango += " AND v.f_venta <= ?"; params.push(hasta); }

  const [[fila]] = await cx.query(
    `SELECT
       COUNT(*) AS lineas,
       SUM(dv.costo_unitario IS NULL) AS lineas_sin_costo,
       COALESCE(SUM(dv.total), 0) AS ingreso,
       COALESCE(SUM(CASE WHEN dv.costo_unitario IS NOT NULL THEN dv.costo_unitario * dv.cantidad END), 0) AS costo,
       COALESCE(SUM(CASE WHEN dv.costo_unitario IS NOT NULL THEN dv.total END), 0) AS ingreso_con_costo
     FROM detalle_venta dv
     INNER JOIN venta v ON v.id_venta = dv.id_venta AND v.id_tenant = dv.id_tenant
     WHERE dv.id_tenant = ? AND v.estado_venta = 1${rango}`,
    params
  );

  const ingresoConCosto = Number(fila.ingreso_con_costo);
  const costo = Number(fila.costo);
  const margen = Math.round((ingresoConCosto - costo) * 100) / 100;

  return {
    lineas: Number(fila.lineas),
    lineasSinCosto: Number(fila.lineas_sin_costo || 0),
    ingresoTotal: Math.round(Number(fila.ingreso) * 100) / 100,
    // El margen solo cubre las líneas con costo conocido: mezclarlas con las
    // que no lo tienen daría un margen inflado.
    ingresoConCosto: Math.round(ingresoConCosto * 100) / 100,
    costo: Math.round(costo * 100) / 100,
    margen,
    porcentaje: ingresoConCosto > 0 ? Math.round((margen / ingresoConCosto) * 1000) / 10 : null,
  };
};

export default {
  obtenerEstadoCosto,
  aplicarIngresoAlCosto,
  obtenerCostosVigentes,
  valorizarInventario,
  obtenerMargenPorPeriodo,
};
