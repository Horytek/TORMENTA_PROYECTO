import { getConnection } from "../database/database.js";

const getFacturas = async (req, res) => {
  const { estado = "", id_destinatario = "" } = req.query;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    const where = ["fc.id_tenant = ?"];
    const params = [id_tenant];
    if (estado) { where.push("fc.estado = ?"); params.push(estado); }
    if (id_destinatario) { where.push("fc.id_destinatario = ?"); params.push(id_destinatario); }

    const [rows] = await connection.query(
      `SELECT
         fc.id_factura_compra AS id,
         fc.num_factura,
         fc.fecha_emision,
         fc.fecha_vencimiento,
         fc.monto_total,
         fc.estado,
         fc.id_orden_compra,
         fc.tipo_doc_proveedor,
         fc.serie,
         fc.correlativo,
         fc.ruc_proveedor,
         fc.moneda,
         fc.mto_oper_gravadas,
         fc.mto_igv,
         COALESCE(d.razon_social, CONCAT(d.nombres, ' ', d.apellidos)) AS proveedor,
         fc.id_destinatario
       FROM factura_compra fc
       LEFT JOIN destinatario d ON fc.id_destinatario = d.id_destinatario
       WHERE ${where.join(" AND ")}
       ORDER BY fc.fecha_emision DESC, fc.id_factura_compra DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error en getFacturas:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const crearFactura = async (req, res) => {
  const {
    id_orden_compra, id_destinatario, num_factura, fecha_emision, fecha_vencimiento, monto_total,
    // Campos fiscales para el futuro Registro de Compras (RCE): opcionales,
    // no bloquean el flujo de cuentas por pagar que ya funciona sin ellos.
    tipo_doc_proveedor, serie, correlativo, moneda, tipo_cambio, mto_oper_gravadas, mto_igv,
  } = req.body;
  const id_tenant = req.id_tenant;
  const id_usuario_crea = req.user?.id_usuario ?? null;

  if (!id_destinatario || !num_factura || !fecha_emision || !fecha_vencimiento || !monto_total) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios de la factura" });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // Snapshot del RUC del proveedor al momento de la factura: si el
    // proveedor cambia de RUC después, esta factura ya emitida no debe
    // reescribirse retroactivamente (mismo criterio que el costo de venta).
    const [[proveedor]] = await connection.query(
      "SELECT ruc FROM destinatario WHERE id_destinatario = ? AND id_tenant = ?",
      [id_destinatario, id_tenant]
    );

    const [facturaResult] = await connection.query(
      `INSERT INTO factura_compra
       (id_tenant, id_orden_compra, id_destinatario, num_factura, fecha_emision, fecha_vencimiento, monto_total, estado, id_usuario_crea,
        tipo_doc_proveedor, serie, correlativo, ruc_proveedor, moneda, tipo_cambio, mto_oper_gravadas, mto_igv)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_tenant, id_orden_compra || null, id_destinatario, num_factura, fecha_emision, fecha_vencimiento, monto_total, id_usuario_crea,
        tipo_doc_proveedor || null, serie || null, correlativo || null, proveedor?.ruc || null,
        moneda || 'PEN', tipo_cambio || null, mto_oper_gravadas ?? null, mto_igv ?? null,
      ]
    );
    const id_factura_compra = facturaResult.insertId;

    await connection.query(
      `INSERT INTO cuenta_por_pagar (id_tenant, id_factura_compra, monto_total, saldo, fecha_vencimiento, estado)
       VALUES (?, ?, ?, ?, ?, 'pendiente')`,
      [id_tenant, id_factura_compra, monto_total, monto_total, fecha_vencimiento]
    );

    await connection.commit();
    res.json({ success: true, message: "Factura registrada y cuenta por pagar generada", data: { id: id_factura_compra } });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "Ya existe una factura con ese número para este proveedor" });
    }
    console.error("Error en crearFactura:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = { getFacturas, crearFactura };
