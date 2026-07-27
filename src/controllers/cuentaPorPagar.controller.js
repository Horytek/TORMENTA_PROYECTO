import { getConnection } from "../database/database.js";

const getCuentasPorPagar = async (req, res) => {
  const { estado = "" } = req.query;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    const where = ["cxp.id_tenant = ?"];
    const params = [id_tenant];
    if (estado) { where.push("cxp.estado = ?"); params.push(estado); }

    const [rows] = await connection.query(
      `SELECT
         cxp.id_cuenta_por_pagar AS id,
         cxp.monto_total,
         cxp.saldo,
         cxp.fecha_vencimiento,
         cxp.estado,
         fc.num_factura,
         fc.id_factura_compra,
         COALESCE(d.razon_social, CONCAT(d.nombres, ' ', d.apellidos)) AS proveedor
       FROM cuenta_por_pagar cxp
       INNER JOIN factura_compra fc ON fc.id_factura_compra = cxp.id_factura_compra
       LEFT JOIN destinatario d ON fc.id_destinatario = d.id_destinatario
       WHERE ${where.join(" AND ")}
       ORDER BY cxp.fecha_vencimiento ASC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error en getCuentasPorPagar:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const getPagos = async (req, res) => {
  const { id } = req.params;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.query(
      "SELECT id_pago, monto, fecha, medio_pago, referencia FROM pago_cuenta_por_pagar WHERE id_cuenta_por_pagar = ? AND id_tenant = ? ORDER BY fecha DESC",
      [id, id_tenant]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error en getPagos:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const registrarPago = async (req, res) => {
  const { id } = req.params;
  const { monto, fecha, medio_pago, referencia } = req.body;
  const id_tenant = req.id_tenant;
  const id_usuario_registra = req.user?.id_usuario ?? null;

  const montoPago = Number(monto);
  if (!montoPago || montoPago <= 0 || !fecha || !medio_pago) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios del pago" });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[cxp]] = await connection.query(
      "SELECT saldo, id_factura_compra FROM cuenta_por_pagar WHERE id_cuenta_por_pagar = ? AND id_tenant = ? FOR UPDATE",
      [id, id_tenant]
    );
    if (!cxp) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Cuenta por pagar no encontrada" });
    }
    if (montoPago > Number(cxp.saldo)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "El pago no puede superar el saldo pendiente" });
    }

    await connection.query(
      `INSERT INTO pago_cuenta_por_pagar (id_cuenta_por_pagar, id_tenant, monto, fecha, medio_pago, referencia, id_usuario_registra)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, id_tenant, montoPago, fecha, medio_pago, referencia || null, id_usuario_registra]
    );

    const nuevoSaldo = Math.round((Number(cxp.saldo) - montoPago) * 100) / 100;
    const nuevoEstado = nuevoSaldo <= 0 ? "pagada" : "pagada_parcial";

    await connection.query(
      "UPDATE cuenta_por_pagar SET saldo = ?, estado = ? WHERE id_cuenta_por_pagar = ? AND id_tenant = ?",
      [nuevoSaldo, nuevoEstado, id, id_tenant]
    );

    if (nuevoSaldo <= 0) {
      await connection.query(
        "UPDATE factura_compra SET estado = 'pagada' WHERE id_factura_compra = ? AND id_tenant = ?",
        [cxp.id_factura_compra, id_tenant]
      );
    }

    await connection.commit();
    res.json({ success: true, message: "Pago registrado", data: { saldo: nuevoSaldo, estado: nuevoEstado } });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en registrarPago:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = { getCuentasPorPagar, getPagos, registrarPago };
