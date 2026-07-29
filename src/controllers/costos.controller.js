import { getConnection } from "../database/database.js";
import {
  productosSinCosto,
  skusDeProductoConCosto,
  establecerCostosIniciales,
  valorizarInventario,
} from "../services/costos/costoRepository.js";
import { planificarCargaProducto, CostoInvalidoError } from "../services/costos/costoInicial.js";

/**
 * Carga inicial de costos.
 *
 * El modelo de costo promedio ya funciona, pero solo se llena hacia adelante:
 * un negocio que arranca con stock viejo tiene todas sus prendas sin costo, y
 * sin costo no hay margen que mostrar. Estos endpoints existen para poner el
 * sistema al día una vez.
 *
 * Se trabaja a nivel PRODUCTO: en ropa las tallas y colores de una misma prenda
 * cuestan lo mismo, así que son ~150 números en vez de ~1700.
 */

/** GET /api/costos/cobertura — cuánto del inventario tiene costo conocido. */
const obtenerCobertura = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const resumen = await valorizarInventario(connection, { id_tenant: req.id_tenant });
    res.json({ success: true, data: resumen });
  } catch (error) {
    console.error("Error en costos.obtenerCobertura:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

/** GET /api/costos/pendientes — productos sin costo, los que más pesan primero. */
const listarPendientes = async (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 200, 500);
  let connection;
  try {
    connection = await getConnection();
    const data = await productosSinCosto(connection, { id_tenant: req.id_tenant, limite });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error en costos.listarPendientes:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * POST /api/costos/inicial — declara el costo de uno o varios productos.
 *
 * Body: { forzar?: boolean, items: [{ id_producto, costo }] }
 *
 * Todo o nada: si un ítem trae un costo inválido se revierte la transacción
 * entera. Una carga a medias es peor que ninguna, porque no queda claro qué
 * quedó cargado y qué no.
 */
const cargarCostosIniciales = async (req, res) => {
  const id_tenant = req.id_tenant;
  const { items, forzar = false } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Se requiere al menos un producto" });
  }
  if (items.length > 500) {
    return res.status(400).json({ success: false, message: "Máximo 500 productos por carga" });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const detalle = [];
    let skusActualizados = 0;

    for (const item of items) {
      const id_producto = Number(item?.id_producto);
      if (!Number.isInteger(id_producto) || id_producto <= 0) {
        throw new CostoInvalidoError(item?.id_producto, "no es un id_producto válido");
      }

      // `skusDeProductoConCosto` filtra por tenant, así que un id_producto de
      // otro cliente devuelve lista vacía y no escribe nada.
      const skus = await skusDeProductoConCosto(connection, { id_tenant, id_producto });
      if (skus.length === 0) {
        detalle.push({ id_producto, actualizados: 0, omitidos: 0, aviso: "sin variantes activas" });
        continue;
      }

      const plan = planificarCargaProducto({ skus, costo: item.costo, forzar });
      const escritos = await establecerCostosIniciales(connection, { id_tenant, asignaciones: plan.aplicar });
      skusActualizados += escritos;
      detalle.push({
        id_producto,
        costo: plan.aplicar[0]?.costo ?? null,
        actualizados: escritos,
        omitidos: plan.omitidos.length,
      });
    }

    await connection.commit();

    const cobertura = await valorizarInventario(connection, { id_tenant });
    res.json({
      success: true,
      data: { productos: items.length, skusActualizados, detalle, cobertura },
      message: `${skusActualizados} variante(s) con costo`,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error instanceof CostoInvalidoError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error en costos.cargarCostosIniciales:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = {
  obtenerCobertura,
  listarPendientes,
  cargarCostosIniciales,
};
