import { stockPorProducto } from "../inventario/stockRepository.js";

/**
 * Acceso a la composición de combos/kits (`combo_item`).
 *
 * Un combo no tiene stock propio: su disponibilidad y su costo se derivan
 * de sus componentes reales (productos normales, con su propio `producto_sku`
 * e `inventario_stock`).
 */

/** { id_producto_combo → [{ id_producto_componente, cantidad }] } para varios combos a la vez. */
export const getComboItemsPorProductos = async (cx, { id_tenant, ids_producto_combo }) => {
  const mapa = new Map();
  if (!Array.isArray(ids_producto_combo) || ids_producto_combo.length === 0) return mapa;

  const [filas] = await cx.query(
    `SELECT id_producto_combo, id_producto_componente, cantidad
     FROM combo_item
     WHERE id_tenant = ? AND id_producto_combo IN (${ids_producto_combo.map(() => "?").join(",")})`,
    [id_tenant, ...ids_producto_combo]
  );

  for (const fila of filas) {
    const lista = mapa.get(fila.id_producto_combo) ?? [];
    lista.push({ id_producto_componente: fila.id_producto_componente, cantidad: Number(fila.cantidad) });
    mapa.set(fila.id_producto_combo, lista);
  }
  return mapa;
};

/** Composición de UN combo, con la descripción de cada componente (para la UI). */
export const getComboItems = async (cx, { id_tenant, id_producto_combo }) => {
  const [filas] = await cx.query(
    `SELECT ci.id_producto_componente, ci.cantidad, p.descripcion, p.precio
     FROM combo_item ci
     INNER JOIN producto p ON p.id_producto = ci.id_producto_componente AND p.id_tenant = ci.id_tenant
     WHERE ci.id_tenant = ? AND ci.id_producto_combo = ?
     ORDER BY ci.id_combo_item`,
    [id_tenant, id_producto_combo]
  );
  return filas.map((f) => ({ ...f, cantidad: Number(f.cantidad), precio: Number(f.precio) }));
};

/**
 * Reemplaza la composición completa de un combo (delete + insert dentro de
 * la misma conexión). Es más simple que un diff línea por línea y la
 * composición de un combo no cambia con frecuencia suficiente como para que
 * importe.
 */
export const setComboItems = async (cx, { id_tenant, id_producto_combo, items }) => {
  const limpios = (items || [])
    .map((it) => ({ id_producto_componente: Number(it.id_producto_componente), cantidad: Number(it.cantidad) }))
    .filter((it) => Number.isInteger(it.id_producto_componente) && it.cantidad > 0 && it.id_producto_componente !== id_producto_combo);

  await cx.query("DELETE FROM combo_item WHERE id_tenant = ? AND id_producto_combo = ?", [id_tenant, id_producto_combo]);

  if (limpios.length === 0) return;

  const values = limpios.map(() => "(?, ?, ?, ?)").join(", ");
  const params = limpios.flatMap((it) => [id_producto_combo, it.id_producto_componente, it.cantidad, id_tenant]);
  await cx.query(
    `INSERT INTO combo_item (id_producto_combo, id_producto_componente, cantidad, id_tenant) VALUES ${values}`,
    params
  );
};

/**
 * Cuántos combos completos se pueden armar hoy, para una lista de combos.
 * Es el mínimo, por componente, de floor(stock_componente / cantidad_requerida).
 * Un combo sin composición o sin stock en algún componente da 0 (no vendible).
 *
 * @returns {Promise<Map<number, number>>} id_producto_combo → unidades armables
 */
export const disponibilidadCombos = async (cx, { id_tenant, ids_producto_combo, id_almacen = null }) => {
  const resultado = new Map();
  if (!Array.isArray(ids_producto_combo) || ids_producto_combo.length === 0) return resultado;

  const itemsPorCombo = await getComboItemsPorProductos(cx, { id_tenant, ids_producto_combo });
  const idsComponentes = [...new Set([...itemsPorCombo.values()].flat().map((i) => i.id_producto_componente))];
  const stockMap = await stockPorProducto(cx, { id_tenant, id_almacen, ids_producto: idsComponentes });

  for (const id_combo of ids_producto_combo) {
    const items = itemsPorCombo.get(id_combo);
    if (!items || items.length === 0) {
      resultado.set(id_combo, 0);
      continue;
    }
    const armables = Math.min(
      ...items.map((it) => Math.floor((stockMap.get(it.id_producto_componente) ?? 0) / it.cantidad))
    );
    resultado.set(id_combo, Math.max(0, armables));
  }
  return resultado;
};

export default { getComboItemsPorProductos, getComboItems, setComboItems, disponibilidadCombos };
