import { getConnection } from "../database/database.js";

const getCuentasPorCobrar = async (req, res) => {
  const { estado = "", id_cliente = "" } = req.query;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    const where = ["cxc.id_tenant = ?"];
    const params = [id_tenant];
    if (estado) { where.push("cxc.estado = ?"); params.push(estado); }
    if (id_cliente) { where.push("cxc.id_cliente = ?"); params.push(id_cliente); }

    const [rows] = await connection.query(
      `SELECT
         cxc.id_cuenta_por_cobrar AS id,
         cxc.monto_total,
         cxc.saldo,
         cxc.fecha_vencimiento,
         cxc.estado,
         cxc.id_venta,
         COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos)) AS cliente
       FROM cuenta_por_cobrar cxc
       LEFT JOIN cliente c ON c.id_cliente = cxc.id_cliente
       WHERE ${where.join(" AND ")}
       ORDER BY cxc.fecha_vencimiento ASC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error en getCuentasPorCobrar:", error);
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
      "SELECT id_pago, monto, fecha, medio_pago, referencia FROM pago_cuenta_por_cobrar WHERE id_cuenta_por_cobrar = ? AND id_tenant = ? ORDER BY fecha DESC",
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
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios del cobro" });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[cxc]] = await connection.query(
      "SELECT saldo FROM cuenta_por_cobrar WHERE id_cuenta_por_cobrar = ? AND id_tenant = ? FOR UPDATE",
      [id, id_tenant]
    );
    if (!cxc) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Cuenta por cobrar no encontrada" });
    }
    if (montoPago > Number(cxc.saldo)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "El cobro no puede superar el saldo pendiente" });
    }

    await connection.query(
      `INSERT INTO pago_cuenta_por_cobrar (id_cuenta_por_cobrar, id_tenant, monto, fecha, medio_pago, referencia, id_usuario_registra)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, id_tenant, montoPago, fecha, medio_pago, referencia || null, id_usuario_registra]
    );

    const nuevoSaldo = Math.round((Number(cxc.saldo) - montoPago) * 100) / 100;
    const nuevoEstado = nuevoSaldo <= 0 ? "pagada" : "pagada_parcial";

    await connection.query(
      "UPDATE cuenta_por_cobrar SET saldo = ?, estado = ? WHERE id_cuenta_por_cobrar = ? AND id_tenant = ?",
      [nuevoSaldo, nuevoEstado, id, id_tenant]
    );

    await connection.commit();
    res.json({ success: true, message: "Cobro registrado", data: { saldo: nuevoSaldo, estado: nuevoEstado } });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en registrarPago (CxC):", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

/** Saldo total pendiente de un cliente — usado para el chequeo de límite de crédito. */
export const saldoPendienteCliente = async (connection, { id_cliente, id_tenant }) => {
  const [[row]] = await connection.query(
    "SELECT COALESCE(SUM(saldo), 0) AS saldo FROM cuenta_por_cobrar WHERE id_cliente = ? AND id_tenant = ? AND estado != 'pagada'",
    [id_cliente, id_tenant]
  );
  return Number(row.saldo) || 0;
};

export const methods = { getCuentasPorCobrar, getPagos, registrarPago };
