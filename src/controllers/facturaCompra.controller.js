import { getConnection } from "../database/database.js";

const getFacturas = async (req, res) => {
  const { estado = "" } = req.query;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    const where = ["fc.id_tenant = ?"];
    const params = [id_tenant];
    if (estado) { where.push("fc.estado = ?"); params.push(estado); }

    const [rows] = await connection.query(
      `SELECT
         fc.id_factura_compra AS id,
         fc.num_factura,
         fc.fecha_emision,
         fc.fecha_vencimiento,
         fc.monto_total,
         fc.estado,
         fc.id_orden_compra,
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
  const { id_orden_compra, id_destinatario, num_factura, fecha_emision, fecha_vencimiento, monto_total } = req.body;
  const id_tenant = req.id_tenant;
  const id_usuario_crea = req.user?.id_usuario ?? null;

  if (!id_destinatario || !num_factura || !fecha_emision || !fecha_vencimiento || !monto_total) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios de la factura" });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [facturaResult] = await connection.query(
      `INSERT INTO factura_compra
       (id_tenant, id_orden_compra, id_destinatario, num_factura, fecha_emision, fecha_vencimiento, monto_total, estado, id_usuario_crea)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
      [id_tenant, id_orden_compra || null, id_destinatario, num_factura, fecha_emision, fecha_vencimiento, monto_total, id_usuario_crea]
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
