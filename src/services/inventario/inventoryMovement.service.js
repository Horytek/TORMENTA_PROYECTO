import { getConnection } from "../../database/database.js";
import { sumarStockSku, restarStockSku } from "./stockRepository.js";
import { crearIngresoCore } from "../../controllers/notaingreso.controller.js";
import { crearSalidaCore } from "../../controllers/notasalida.controller.js";

/**
 * Servicio de dominio para Transferencias Guiadas e Inventario Físico Ciego.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFERENCIAS GUIADAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera código correlativo para transferencias (ej. TR-202608-0001).
 */
const generarCodigoTransferencia = async (cx, id_tenant) => {
  const prefijo = `TR-${new Date().toISOString().slice(0, 7).replace("-", "")}`;
  const [[fila]] = await cx.query(
    `SELECT COUNT(*) AS total FROM transferencia_guiada WHERE id_tenant = ? AND codigo_transferencia LIKE ?`,
    [id_tenant, `${prefijo}-%`]
  );
  const correlativo = String((fila?.total ?? 0) + 1).padStart(4, "0");
  return `${prefijo}-${correlativo}`;
};

/**
 * Crear solicitud de transferencia guiada (Estado: SOLICITADA).
 */
export const crearTransferenciaGuiada = async ({
  id_tenant,
  id_almacen_origen,
  id_almacen_destino,
  glosa,
  id_usuario_solicita,
  observaciones,
  items,
}) => {
  if (!id_almacen_origen || !id_almacen_destino || !id_usuario_solicita || !Array.isArray(items) || items.length === 0) {
    throw new Error("Datos incompletos para crear la solicitud de transferencia.");
  }
  if (Number(id_almacen_origen) === Number(id_almacen_destino)) {
    throw new Error("El almacén de origen y destino deben ser diferentes.");
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const codigo_transferencia = await generarCodigoTransferencia(connection, id_tenant);

    const [resTrans] = await connection.query(
      `INSERT INTO transferencia_guiada 
       (id_tenant, id_almacen_origen, id_almacen_destino, codigo_transferencia, estado, glosa, id_usuario_solicita, observaciones)
       VALUES (?, ?, ?, ?, 'SOLICITADA', ?, ?, ?)`,
      [id_tenant, id_almacen_origen, id_almacen_destino, codigo_transferencia, glosa || null, id_usuario_solicita, observaciones || null]
    );

    const id_transferencia = resTrans.insertId;

    for (const item of items) {
      if (!item.id_sku || !item.cantidad_solicitada || item.cantidad_solicitada <= 0) {
        throw new Error("Cada ítem debe tener un SKU válido y cantidad solicitada mayor a 0.");
      }
      await connection.query(
        `INSERT INTO transferencia_guiada_detalle (id_transferencia, id_sku, cantidad_solicitada, observacion_item)
         VALUES (?, ?, ?, ?)`,
        [id_transferencia, item.id_sku, Number(item.cantidad_solicitada), item.observacion_item || null]
      );
    }

    await connection.commit();
    return { id_transferencia, codigo_transferencia, estado: "SOLICITADA" };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Despachar transferencia guiada (Estado: SOLICITADA -> DESPACHADA).
 * Descuenta el stock del almacén de origen.
 */
export const despacharTransferenciaGuiada = async ({
  id_tenant,
  id_transferencia,
  id_usuario_despacha,
  items,
}) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[trans]] = await connection.query(
      `SELECT * FROM transferencia_guiada WHERE id_transferencia = ? AND id_tenant = ? FOR UPDATE`,
      [id_transferencia, id_tenant]
    );

    if (!trans) throw new Error("Transferencia no encontrada.");
    if (trans.estado !== "SOLICITADA") throw new Error(`No se puede despachar una transferencia en estado '${trans.estado}'.`);

    for (const item of items) {
      const cantidadDespachada = Number(item.cantidad_despachada);
      if (isNaN(cantidadDespachada) || cantidadDespachada < 0) {
        throw new Error("Cantidad despachada inválida.");
      }

      await connection.query(
        `UPDATE transferencia_guiada_detalle 
         SET cantidad_despachada = ? 
         WHERE id_transferencia = ? AND id_sku = ?`,
        [cantidadDespachada, id_transferencia, item.id_sku]
      );

      if (cantidadDespachada > 0) {
        await restarStockSku(connection, {
          id_tenant,
          id_sku: item.id_sku,
          id_almacen: trans.id_almacen_origen,
          cantidad: cantidadDespachada,
        });
      }
    }

    await connection.query(
      `UPDATE transferencia_guiada 
       SET estado = 'DESPACHADA', f_despacho = NOW(), id_usuario_despacha = ?
       WHERE id_transferencia = ? AND id_tenant = ?`,
      [id_usuario_despacha, id_transferencia, id_tenant]
    );

    await connection.commit();
    return { id_transferencia, estado: "DESPACHADA" };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Recibir transferencia guiada (Estado: DESPACHADA -> RECIBIDA).
 * Suma el stock ingresado al almacén de destino.
 */
export const recibirTransferenciaGuiada = async ({
  id_tenant,
  id_transferencia,
  id_usuario_recibe,
  items,
}) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[trans]] = await connection.query(
      `SELECT * FROM transferencia_guiada WHERE id_transferencia = ? AND id_tenant = ? FOR UPDATE`,
      [id_transferencia, id_tenant]
    );

    if (!trans) throw new Error("Transferencia no encontrada.");
    if (trans.estado !== "DESPACHADA") throw new Error(`No se puede recibir una transferencia en estado '${trans.estado}'.`);

    for (const item of items) {
      const cantidadRecibida = Number(item.cantidad_recibida);
      if (isNaN(cantidadRecibida) || cantidadRecibida < 0) {
        throw new Error("Cantidad recibida inválida.");
      }

      await connection.query(
        `UPDATE transferencia_guiada_detalle 
         SET cantidad_recibida = ? 
         WHERE id_transferencia = ? AND id_sku = ?`,
        [cantidadRecibida, id_transferencia, item.id_sku]
      );

      if (cantidadRecibida > 0) {
        await sumarStockSku(connection, {
          id_tenant,
          id_sku: item.id_sku,
          id_almacen: trans.id_almacen_destino,
          cantidad: cantidadRecibida,
        });
      }
    }

    await connection.query(
      `UPDATE transferencia_guiada 
       SET estado = 'RECIBIDA', f_recepcion = NOW(), id_usuario_recibe = ?
       WHERE id_transferencia = ? AND id_tenant = ?`,
      [id_usuario_recibe, id_transferencia, id_tenant]
    );

    await connection.commit();
    return { id_transferencia, estado: "RECIBIDA" };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Cancelar transferencia guiada.
 */
export const cancelarTransferenciaGuiada = async ({ id_tenant, id_transferencia, id_usuario }) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[trans]] = await connection.query(
      `SELECT * FROM transferencia_guiada WHERE id_transferencia = ? AND id_tenant = ? FOR UPDATE`,
      [id_transferencia, id_tenant]
    );

    if (!trans) throw new Error("Transferencia no encontrada.");
    if (trans.estado === "RECIBIDA" || trans.estado === "CANCELADA") {
      throw new Error(`No se puede cancelar una transferencia en estado '${trans.estado}'.`);
    }

    // Si ya estaba DESPACHADA, devolvemos el stock al origen
    if (trans.estado === "DESPACHADA") {
      const [detalles] = await connection.query(
        `SELECT id_sku, cantidad_despachada FROM transferencia_guiada_detalle WHERE id_transferencia = ?`,
        [id_transferencia]
      );

      for (const d of detalles) {
        if (d.cantidad_despachada > 0) {
          await sumarStockSku(connection, {
            id_tenant,
            id_sku: d.id_sku,
            id_almacen: trans.id_almacen_origen,
            cantidad: d.cantidad_despachada,
          });
        }
      }
    }

    await connection.query(
      `UPDATE transferencia_guiada SET estado = 'CANCELADA' WHERE id_transferencia = ? AND id_tenant = ?`,
      [id_transferencia, id_tenant]
    );

    await connection.commit();
    return { id_transferencia, estado: "CANCELADA" };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Listar transferencias guiadas.
 */
export const listarTransferenciasGuiadas = async ({ id_tenant, id_almacen = null, estado = null }) => {
  const connection = await getConnection();
  try {
    const where = ["t.id_tenant = ?"];
    const params = [id_tenant];

    if (id_almacen) {
      where.push("(t.id_almacen_origen = ? OR t.id_almacen_destino = ?)");
      params.push(id_almacen, id_almacen);
    }
    if (estado) {
      where.push("t.estado = ?");
      params.push(estado);
    }

    const [rows] = await connection.query(
      `SELECT t.*, 
              ao.nom_almacen AS almacen_origen, 
              ad.nom_almacen AS almacen_destino
       FROM transferencia_guiada t
       LEFT JOIN almacen ao ON ao.id_almacen = t.id_almacen_origen
       LEFT JOIN almacen ad ON ad.id_almacen = t.id_almacen_destino
       WHERE ${where.join(" AND ")}
       ORDER BY t.id_transferencia DESC`,
      params
    );

    for (const r of rows) {
      const [detalles] = await connection.query(
        `SELECT d.*, ps.sku, ps.attributes_json, p.nom_producto
         FROM transferencia_guiada_detalle d
         INNER JOIN producto_sku ps ON ps.id_sku = d.id_sku AND ps.id_tenant = ?
         INNER JOIN producto p ON p.id_producto = ps.id_producto
         WHERE d.id_transferencia = ?`,
        [id_tenant, r.id_transferencia]
      );
      r.detalles = detalles;
    }

    return rows;
  } finally {
    connection.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INVENTARIO FÍSICO CIEGO
// ─────────────────────────────────────────────────────────────────────────────

const generarCodigoConteo = async (cx, id_tenant) => {
  const prefijo = `IF-${new Date().toISOString().slice(0, 7).replace("-", "")}`;
  const [[fila]] = await cx.query(
    `SELECT COUNT(*) AS total FROM inventario_fisico WHERE id_tenant = ? AND codigo_conteo LIKE ?`,
    [id_tenant, `${prefijo}-%`]
  );
  const correlativo = String((fila?.total ?? 0) + 1).padStart(4, "0");
  return `${prefijo}-${correlativo}`;
};

/**
 * Iniciar sesión de conteo ciego (Estado: EN_PROCESO).
 * Guarda snapshot de stock del sistema y costos actuales.
 */
export const crearInventarioFisico = async ({
  id_tenant,
  id_almacen,
  titulo,
  id_usuario_crea,
  observaciones,
}) => {
  if (!id_almacen || !titulo || !id_usuario_crea) {
    throw new Error("Faltan parámetros requeridos para crear el conteo ciego.");
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const codigo_conteo = await generarCodigoConteo(connection, id_tenant);

    const [resInv] = await connection.query(
      `INSERT INTO inventario_fisico
       (id_tenant, id_almacen, codigo_conteo, titulo, estado, id_usuario_crea, observaciones)
       VALUES (?, ?, ?, ?, 'EN_PROCESO', ?, ?)`,
      [id_tenant, id_almacen, codigo_conteo, titulo, id_usuario_crea, observaciones || null]
    );

    const id_inventario_fisico = resInv.insertId;

    // Snapshot del stock y costos de los SKUs en este almacén
    const [skus] = await connection.query(
      `SELECT s.id_sku, s.stock, COALESCE(cs.costo_promedio, 0.0000) AS costo_promedio
       FROM inventario_stock s
       LEFT JOIN costo_sku cs ON cs.id_sku = s.id_sku AND cs.id_tenant = s.id_tenant
       WHERE s.id_tenant = ? AND s.id_almacen = ?`,
      [id_tenant, id_almacen]
    );

    for (const s of skus) {
      await connection.query(
        `INSERT INTO inventario_fisico_detalle 
         (id_inventario_fisico, id_sku, stock_sistema_snapshot, costo_unitario_snapshot)
         VALUES (?, ?, ?, ?)`,
        [id_inventario_fisico, s.id_sku, Number(s.stock), Number(s.costo_promedio)]
      );
    }

    await connection.commit();
    return { id_inventario_fisico, codigo_conteo, estado: "EN_PROCESO", total_skus: skus.length };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Registrar conteo ciego ingresado por operadores.
 */
export const registrarConteoCiego = async ({ id_tenant, id_inventario_fisico, conteos }) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[inv]] = await connection.query(
      `SELECT * FROM inventario_fisico WHERE id_inventario_fisico = ? AND id_tenant = ? FOR UPDATE`,
      [id_inventario_fisico, id_tenant]
    );

    if (!inv) throw new Error("Sesión de inventario físico no encontrada.");
    if (inv.estado === "APLICADO" || inv.estado === "CANCELADO") {
      throw new Error(`No se puede modificar un inventario en estado '${inv.estado}'.`);
    }

    for (const c of conteos) {
      const cantidadContada = Number(c.cantidad_contada);
      if (isNaN(cantidadContada) || cantidadContada < 0) {
        throw new Error(`Cantidad contada inválida para SKU ${c.id_sku}.`);
      }

      await connection.query(
        `UPDATE inventario_fisico_detalle 
         SET cantidad_contada = ?, 
             diferencia = ? - stock_sistema_snapshot, 
             observacion_item = ?
         WHERE id_inventario_fisico = ? AND id_sku = ?`,
        [cantidadContada, cantidadContada, c.observacion_item || null, id_inventario_fisico, c.id_sku]
      );
    }

    await connection.query(
      `UPDATE inventario_fisico SET estado = 'CONTEO_COMPLETADO' WHERE id_inventario_fisico = ? AND id_tenant = ?`,
      [id_inventario_fisico, id_tenant]
    );

    await connection.commit();
    return { id_inventario_fisico, estado: "CONTEO_COMPLETADO" };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Reconciliar y aplicar ajuste automático de stock en 1 clic.
 */
export const reconciliarYAplicarAjuste = async ({
  id_tenant,
  id_inventario_fisico,
  id_usuario_aplica,
}) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[inv]] = await connection.query(
      `SELECT * FROM inventario_fisico WHERE id_inventario_fisico = ? AND id_tenant = ? FOR UPDATE`,
      [id_inventario_fisico, id_tenant]
    );

    if (!inv) throw new Error("Sesión de inventario físico no encontrada.");
    if (inv.estado !== "CONTEO_COMPLETADO") {
      throw new Error(`Se requiere que el conteo esté completado antes de aplicar el ajuste. Estado actual: '${inv.estado}'.`);
    }

    const [detalles] = await connection.query(
      `SELECT * FROM inventario_fisico_detalle WHERE id_inventario_fisico = ? AND diferencia IS NOT NULL AND diferencia <> 0`,
      [id_inventario_fisico]
    );

    for (const d of detalles) {
      if (d.diferencia > 0) {
        // Sobrante -> Ingreso de ajuste
        await sumarStockSku(connection, {
          id_tenant,
          id_sku: d.id_sku,
          id_almacen: inv.id_almacen,
          cantidad: d.diferencia,
        });
      } else if (d.diferencia < 0) {
        // Faltante -> Salida de ajuste
        await restarStockSku(connection, {
          id_tenant,
          id_sku: d.id_sku,
          id_almacen: inv.id_almacen,
          cantidad: Math.abs(d.diferencia),
        });
      }
    }

    await connection.query(
      `UPDATE inventario_fisico 
       SET estado = 'APLICADO', f_aplicacion = NOW(), id_usuario_aplica = ?
       WHERE id_inventario_fisico = ? AND id_tenant = ?`,
      [id_usuario_aplica, id_inventario_fisico, id_tenant]
    );

    await connection.commit();
    return { id_inventario_fisico, estado: "APLICADO", ajustados: detalles.length };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Obtener matriz de reconciliación de inventario ciego.
 */
export const obtenerMatrizReconciliacion = async ({ id_tenant, id_inventario_fisico }) => {
  const connection = await getConnection();
  try {
    const [[inv]] = await connection.query(
      `SELECT i.*, a.nom_almacen FROM inventario_fisico i
       LEFT JOIN almacen a ON a.id_almacen = i.id_almacen
       WHERE i.id_inventario_fisico = ? AND i.id_tenant = ?`,
      [id_inventario_fisico, id_tenant]
    );

    if (!inv) throw new Error("Inventario no encontrado.");

    const [detalles] = await connection.query(
      `SELECT d.*, 
              ps.sku, ps.attributes_json, ps.cod_barras,
              p.nom_producto
       FROM inventario_fisico_detalle d
       INNER JOIN producto_sku ps ON ps.id_sku = d.id_sku AND ps.id_tenant = ?
       INNER JOIN producto p ON p.id_producto = ps.id_producto
       WHERE d.id_inventario_fisico = ?`,
      [id_tenant, id_inventario_fisico]
    );

    const matriz = detalles.map((d) => ({
      ...d,
      valor_diferencia: (Number(d.diferencia) || 0) * Number(d.costo_unitario_snapshot),
    }));

    const valorTotalDiferencia = matriz.reduce((acc, curr) => acc + curr.valor_diferencia, 0);

    return {
      inventario: inv,
      detalles: matriz,
      resumen: {
        total_items: matriz.length,
        sobrantes_count: matriz.filter((m) => (m.diferencia || 0) > 0).length,
        faltantes_count: matriz.filter((m) => (m.diferencia || 0) < 0).length,
        coincidentes_count: matriz.filter((m) => m.diferencia === 0).length,
        valor_total_diferencia: valorTotalDiferencia,
      },
    };
  } finally {
    connection.release();
  }
};

/**
 * Listar sesiones de inventario físico.
 */
export const listarInventariosFisicos = async ({ id_tenant, id_almacen = null }) => {
  const connection = await getConnection();
  try {
    const where = ["i.id_tenant = ?"];
    const params = [id_tenant];

    if (id_almacen) {
      where.push("i.id_almacen = ?");
      params.push(id_almacen);
    }

    const [rows] = await connection.query(
      `SELECT i.*, a.nom_almacen
       FROM inventario_fisico i
       LEFT JOIN almacen a ON a.id_almacen = i.id_almacen
       WHERE ${where.join(" AND ")}
       ORDER BY i.id_inventario_fisico DESC`,
      params
    );

    return rows;
  } finally {
    connection.release();
  }
};

export default {
  crearTransferenciaGuiada,
  despacharTransferenciaGuiada,
  recibirTransferenciaGuiada,
  cancelarTransferenciaGuiada,
  listarTransferenciasGuiadas,
  crearInventarioFisico,
  registrarConteoCiego,
  reconciliarYAplicarAjuste,
  obtenerMatrizReconciliacion,
  listarInventariosFisicos,
};
