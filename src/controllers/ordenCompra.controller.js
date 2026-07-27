import { getConnection } from "../database/database.js";
import { logInventario } from "../utils/logActions.js";

const ESTADOS_CANCELABLES = ["draft", "approved"];
const ESTADOS_RECIBIBLES = ["draft", "approved"];

const getOrdenes = async (req, res) => {
  const { estado = "", id_destinatario = "", fecha_i = "2022-01-01", fecha_e = "2099-12-31" } = req.query;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();

    const where = ["oc.id_tenant = ?", "oc.fecha >= ?", "oc.fecha <= ?"];
    const params = [id_tenant, fecha_i, fecha_e];
    if (estado) { where.push("oc.estado = ?"); params.push(estado); }
    if (id_destinatario) { where.push("oc.id_destinatario = ?"); params.push(id_destinatario); }

    const [rows] = await connection.query(
      `SELECT
         oc.id_orden_compra AS id,
         oc.fecha,
         oc.estado,
         oc.glosa,
         oc.observacion,
         COALESCE(d.razon_social, CONCAT(d.nombres, ' ', d.apellidos)) AS proveedor,
         oc.id_destinatario,
         a.nom_almacen AS almacen,
         oc.id_almacen,
         (SELECT ROUND(SUM(total), 2) FROM detalle_orden_compra WHERE id_orden_compra = oc.id_orden_compra) AS monto_total
       FROM orden_compra oc
       LEFT JOIN destinatario d ON oc.id_destinatario = d.id_destinatario
       LEFT JOIN almacen a ON oc.id_almacen = a.id_almacen
       WHERE ${where.join(" AND ")}
       ORDER BY oc.fecha DESC, oc.id_orden_compra DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error en getOrdenes:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const getOrdenDetalle = async (req, res) => {
  const { id } = req.params;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();

    const [[cabecera]] = await connection.query(
      `SELECT
         oc.id_orden_compra AS id,
         oc.fecha,
         oc.estado,
         oc.glosa,
         oc.observacion,
         oc.id_destinatario,
         COALESCE(d.razon_social, CONCAT(d.nombres, ' ', d.apellidos)) AS proveedor,
         oc.id_almacen,
         a.nom_almacen AS almacen,
         oc.fecha_creacion,
         n.id_nota AS id_nota_recepcion
       FROM orden_compra oc
       LEFT JOIN destinatario d ON oc.id_destinatario = d.id_destinatario
       LEFT JOIN almacen a ON oc.id_almacen = a.id_almacen
       LEFT JOIN nota n ON n.id_orden_compra = oc.id_orden_compra AND n.id_tenant = oc.id_tenant
       WHERE oc.id_orden_compra = ? AND oc.id_tenant = ?`,
      [id, id_tenant]
    );

    if (!cabecera) {
      return res.status(404).json({ success: false, message: "Orden de compra no encontrada" });
    }

    const [items] = await connection.query(
      `SELECT
         doc.id_detalle_orden_compra,
         doc.id_producto,
         p.descripcion,
         m.nom_marca AS marca,
         doc.cantidad,
         doc.precio_unitario,
         doc.total,
         t.nombre AS nombre_tonalidad,
         ta.nombre AS nombre_talla,
         ps.sku AS sku_label
       FROM detalle_orden_compra doc
       INNER JOIN producto p ON p.id_producto = doc.id_producto
       INNER JOIN marca m ON p.id_marca = m.id_marca
       LEFT JOIN tonalidad t ON doc.id_tonalidad = t.id_tonalidad
       LEFT JOIN talla ta ON doc.id_talla = ta.id_talla
       LEFT JOIN producto_sku ps ON doc.id_sku = ps.id_sku
       WHERE doc.id_orden_compra = ? AND doc.id_tenant = ?`,
      [id, id_tenant]
    );

    res.json({ success: true, data: { ...cabecera, items } });
  } catch (error) {
    console.error("Error en getOrdenDetalle:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const crearOrden = async (req, res) => {
  const { id_destinatario, id_almacen, fecha, glosa, observacion, items } = req.body;
  const id_tenant = req.id_tenant;
  const id_usuario_crea = req.user?.id_usuario ?? null;

  if (!id_destinatario || !id_almacen || !fecha || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios de la orden de compra" });
  }
  for (const it of items) {
    if (!it.id_producto || !it.cantidad || it.precio_unitario == null) {
      return res.status(400).json({ success: false, message: "Cada ítem requiere producto, cantidad y precio unitario" });
    }
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [ordenResult] = await connection.query(
      `INSERT INTO orden_compra (id_tenant, id_destinatario, id_almacen, fecha, glosa, observacion, estado, id_usuario_crea)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [id_tenant, id_destinatario, id_almacen, fecha, glosa || null, observacion || null, id_usuario_crea]
    );
    const id_orden_compra = ordenResult.insertId;

    const values = [];
    const params = [];
    for (const it of items) {
      const cantidad = Number(it.cantidad);
      const precio = Number(it.precio_unitario);
      const total = Math.round(cantidad * precio * 100) / 100;
      values.push("(?, ?, ?, ?, ?, ?, ?, ?, ?)");
      params.push(
        id_orden_compra, it.id_producto, it.id_tonalidad || null, it.id_talla || null, it.id_sku || null,
        cantidad, precio, total, id_tenant
      );
    }
    await connection.query(
      `INSERT INTO detalle_orden_compra
       (id_orden_compra, id_producto, id_tonalidad, id_talla, id_sku, cantidad, precio_unitario, total, id_tenant)
       VALUES ${values.join(", ")}`,
      params
    );

    await connection.commit();
    res.json({ success: true, message: "Orden de compra creada", data: { id: id_orden_compra } });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en crearOrden:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const aprobarOrden = async (req, res) => {
  const { id } = req.params;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.query(
      "UPDATE orden_compra SET estado = 'approved' WHERE id_orden_compra = ? AND id_tenant = ? AND estado = 'draft'",
      [id, id_tenant]
    );
    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, message: "Solo se puede aprobar una orden en borrador" });
    }
    res.json({ success: true, message: "Orden aprobada" });
  } catch (error) {
    console.error("Error en aprobarOrden:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const cancelarOrden = async (req, res) => {
  const { id } = req.params;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.query(
      `UPDATE orden_compra SET estado = 'cancelled' WHERE id_orden_compra = ? AND id_tenant = ? AND estado IN (${ESTADOS_CANCELABLES.map(() => "?").join(",")})`,
      [id, id_tenant, ...ESTADOS_CANCELABLES]
    );
    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, message: "La orden no se puede cancelar en su estado actual" });
    }
    res.json({ success: true, message: "Orden cancelada" });
  } catch (error) {
    console.error("Error en cancelarOrden:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

/** Próximo número de comprobante de ingreso (id_tipocomprobante=6), igual que notaingreso.controller.js. */
async function siguienteNumComprobante(connection, id_tenant) {
  const [rows] = await connection.query(
    "SELECT num_comprobante FROM comprobante WHERE id_tipocomprobante = 6 AND id_tenant = ? ORDER BY num_comprobante DESC LIMIT 1",
    [id_tenant]
  );
  if (rows.length === 0) return "I400-00000001";
  const [prefijo, numeroStr] = rows[0].num_comprobante.split("-");
  const serie = prefijo.substring(1);
  const numero = parseInt(numeroStr, 10) + 1;
  if (numero > 99999999) {
    const nuevaSerie = (parseInt(serie, 10) + 1).toString().padStart(3, "0");
    return `I${nuevaSerie}-00000001`;
  }
  return `I${serie}-${numero.toString().padStart(8, "0")}`;
}

// Recepción: reusa el mismo esquema de inventario que `notaingreso.controller.js`
// (nota + detalle_nota + bitacora_nota + inventario), enlazando la nota a la OC
// vía `nota.id_orden_compra` para no duplicar esa lógica.
const recibirOrden = async (req, res) => {
  const { id } = req.params;
  const id_tenant = req.id_tenant;
  const id_usuario = req.user?.id_usuario ?? null;

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[orden]] = await connection.query(
      `SELECT id_orden_compra, id_destinatario, id_almacen, estado FROM orden_compra
       WHERE id_orden_compra = ? AND id_tenant = ? FOR UPDATE`,
      [id, id_tenant]
    );
    if (!orden || !ESTADOS_RECIBIBLES.includes(orden.estado)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "La orden no está en un estado que permita recibirla" });
    }

    const [items] = await connection.query(
      "SELECT id_producto, id_tonalidad, id_talla, cantidad, precio_unitario, total FROM detalle_orden_compra WHERE id_orden_compra = ? AND id_tenant = ?",
      [id, id_tenant]
    );
    if (items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "La orden no tiene ítems" });
    }

    const numComprobante = await siguienteNumComprobante(connection, id_tenant);
    const [comprobanteResult] = await connection.query(
      "INSERT INTO comprobante (id_tipocomprobante, num_comprobante, id_tenant) VALUES (6, ?, ?)",
      [numComprobante, id_tenant]
    );
    const id_comprobante = comprobanteResult.insertId;

    const fecha = new Date().toISOString().slice(0, 10);
    const [notaResult] = await connection.query(
      `INSERT INTO nota
       (id_almacenO, id_almacenD, id_tiponota, id_destinatario, id_comprobante, id_orden_compra, glosa, fecha, nom_nota, estado_nota, observacion, id_usuario, estado_espera, id_tenant)
       VALUES (NULL, ?, 1, ?, ?, ?, 'RECEPCIÓN DE ORDEN DE COMPRA', ?, ?, 0, ?, ?, 0, ?)`,
      [orden.id_almacen, orden.id_destinatario, id_comprobante, id, fecha, numComprobante, `Recepción OC-${id}`, id_usuario, id_tenant]
    );
    const id_nota = notaResult.insertId;

    const detalleValues = [];
    const detalleParams = [];
    for (const it of items) {
      detalleValues.push("(?, ?, ?, ?, ?, ?, ?, ?)");
      detalleParams.push(it.id_producto, id_nota, it.cantidad, it.precio_unitario, it.total, id_tenant, it.id_tonalidad, it.id_talla);
    }
    const [detalleResult] = await connection.query(
      `INSERT INTO detalle_nota (id_producto, id_nota, cantidad, precio, total, id_tenant, id_tonalidad, id_talla)
       VALUES ${detalleValues.join(", ")}`,
      detalleParams
    );
    const firstDetalleId = detalleResult.insertId;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const id_detalle = firstDetalleId + i;

      let where = "id_producto = ? AND id_almacen = ? AND id_tenant = ?";
      const whereParams = [it.id_producto, orden.id_almacen, id_tenant];
      if (it.id_tonalidad !== null) { where += " AND (id_tonalidad <=> ?)"; whereParams.push(it.id_tonalidad); }
      if (it.id_talla !== null) { where += " AND (id_talla <=> ?)"; whereParams.push(it.id_talla); }

      const [[stockRow]] = await connection.query(`SELECT stock FROM inventario WHERE ${where} LIMIT 1`, whereParams);
      const stockAnterior = stockRow ? parseFloat(stockRow.stock) : 0;
      const stockActual = stockAnterior + parseFloat(it.cantidad);

      await connection.query(
        `INSERT INTO inventario (id_producto, id_almacen, id_tonalidad, id_talla, stock, id_tenant)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE stock = stock + VALUES(stock)`,
        [it.id_producto, orden.id_almacen, it.id_tonalidad, it.id_talla, it.cantidad, id_tenant]
      );

      await connection.query(
        `INSERT INTO bitacora_nota (id_nota, id_producto, id_almacen, id_detalle_nota, entra, stock_anterior, stock_actual, fecha, id_tenant, id_tonalidad, id_talla)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_nota, it.id_producto, orden.id_almacen, id_detalle, it.cantidad, stockAnterior, stockActual, fecha, id_tenant, it.id_tonalidad, it.id_talla]
      );
    }

    await connection.query(
      "UPDATE orden_compra SET estado = 'received' WHERE id_orden_compra = ? AND id_tenant = ?",
      [id, id_tenant]
    );

    await connection.commit();

    if (id_usuario) {
      const ip = req.ip || req.connection.remoteAddress || null;
      await logInventario.notaIngreso(id_nota, id_usuario, ip, id_tenant);
    }

    res.json({ success: true, message: "Orden recibida: inventario actualizado", data: { id_nota } });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en recibirOrden:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = {
  getOrdenes,
  getOrdenDetalle,
  crearOrden,
  aprobarOrden,
  cancelarOrden,
  recibirOrden,
};
