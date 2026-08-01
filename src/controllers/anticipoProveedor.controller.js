import { getConnection } from "../database/database.js";

const getAnticipos = async (req, res) => {
  const { estado = "", id_destinatario = "" } = req.query;
  const id_tenant = req.id_tenant;

  let connection;
  try {
    connection = await getConnection();
    const where = ["a.id_tenant = ?"];
    const params = [id_tenant];
    if (estado) { where.push("a.estado = ?"); params.push(estado); }
    if (id_destinatario) { where.push("a.id_destinatario = ?"); params.push(id_destinatario); }

    const [rows] = await connection.query(
      `SELECT
         a.id_anticipo AS id,
         a.monto,
         a.saldo_disponible,
         a.fecha,
         a.medio_pago,
         a.referencia,
         a.estado,
         a.id_destinatario,
         COALESCE(d.razon_social, CONCAT(d.nombres, ' ', d.apellidos)) AS proveedor
       FROM anticipo_proveedor a
       LEFT JOIN destinatario d ON a.id_destinatario = d.id_destinatario
       WHERE ${where.join(" AND ")}
       ORDER BY a.fecha DESC, a.id_anticipo DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error en getAnticipos:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

const crearAnticipo = async (req, res) => {
  const { id_destinatario, monto, fecha, medio_pago, referencia } = req.body;
  const id_tenant = req.id_tenant;
  const id_usuario_registra = req.user?.id_usuario ?? null;

  const montoAnticipo = Number(monto);
  if (!id_destinatario || !montoAnticipo || montoAnticipo <= 0 || !fecha || !medio_pago) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios del anticipo" });
  }

  let connection;
  try {
    connection = await getConnection();
    const [result] = await connection.query(
      `INSERT INTO anticipo_proveedor
       (id_tenant, id_destinatario, monto, saldo_disponible, fecha, medio_pago, referencia, estado, id_usuario_registra)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'disponible', ?)`,
      [id_tenant, id_destinatario, montoAnticipo, montoAnticipo, fecha, medio_pago, referencia || null, id_usuario_registra]
    );
    res.json({ success: true, message: "Anticipo registrado", data: { id: result.insertId } });
  } catch (error) {
    console.error("Error en crearAnticipo:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Aplica parte o todo el saldo de un anticipo contra una cuenta por pagar del
 * MISMO proveedor. Es un pago más: queda en `pago_cuenta_por_pagar` (igual
 * que `cuentaPorPagar.controller.js#registrarPago`) para que el historial de
 * pagos de la cuenta no distinga origen; `id_anticipo` es solo la trazabilidad
 * de dónde salió la plata.
 */
const aplicarAnticipo = async (req, res) => {
  const { id } = req.params;
  const { id_cuenta_por_pagar, monto } = req.body;
  const id_tenant = req.id_tenant;
  const id_usuario_registra = req.user?.id_usuario ?? null;

  const montoAplicar = Number(monto);
  if (!id_cuenta_por_pagar || !montoAplicar || montoAplicar <= 0) {
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios de la aplicación" });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const [[anticipo]] = await connection.query(
      "SELECT saldo_disponible, id_destinatario FROM anticipo_proveedor WHERE id_anticipo = ? AND id_tenant = ? FOR UPDATE",
      [id, id_tenant]
    );
    if (!anticipo) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Anticipo no encontrado" });
    }
    if (montoAplicar > Number(anticipo.saldo_disponible)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "El monto supera el saldo disponible del anticipo" });
    }

    const [[cxp]] = await connection.query(
      `SELECT cxp.saldo, cxp.id_factura_compra, fc.id_destinatario
       FROM cuenta_por_pagar cxp
       INNER JOIN factura_compra fc ON fc.id_factura_compra = cxp.id_factura_compra
       WHERE cxp.id_cuenta_por_pagar = ? AND cxp.id_tenant = ? FOR UPDATE`,
      [id_cuenta_por_pagar, id_tenant]
    );
    if (!cxp) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Cuenta por pagar no encontrada" });
    }
    if (cxp.id_destinatario !== anticipo.id_destinatario) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "El anticipo es de otro proveedor" });
    }
    if (montoAplicar > Number(cxp.saldo)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "El monto supera el saldo pendiente de la cuenta" });
    }

    await connection.query(
      `INSERT INTO pago_cuenta_por_pagar (id_cuenta_por_pagar, id_tenant, monto, fecha, medio_pago, id_anticipo, id_usuario_registra)
       VALUES (?, ?, ?, CURDATE(), 'Anticipo', ?, ?)`,
      [id_cuenta_por_pagar, id_tenant, montoAplicar, id, id_usuario_registra]
    );

    const nuevoSaldoCxp = Math.round((Number(cxp.saldo) - montoAplicar) * 100) / 100;
    const nuevoEstadoCxp = nuevoSaldoCxp <= 0 ? "pagada" : "pagada_parcial";
    await connection.query(
      "UPDATE cuenta_por_pagar SET saldo = ?, estado = ? WHERE id_cuenta_por_pagar = ? AND id_tenant = ?",
      [nuevoSaldoCxp, nuevoEstadoCxp, id_cuenta_por_pagar, id_tenant]
    );
    if (nuevoSaldoCxp <= 0) {
      await connection.query(
        "UPDATE factura_compra SET estado = 'pagada' WHERE id_factura_compra = ? AND id_tenant = ?",
        [cxp.id_factura_compra, id_tenant]
      );
    }

    const nuevoSaldoAnticipo = Math.round((Number(anticipo.saldo_disponible) - montoAplicar) * 100) / 100;
    const nuevoEstadoAnticipo = nuevoSaldoAnticipo <= 0 ? "aplicado" : "disponible";
    await connection.query(
      "UPDATE anticipo_proveedor SET saldo_disponible = ?, estado = ? WHERE id_anticipo = ? AND id_tenant = ?",
      [nuevoSaldoAnticipo, nuevoEstadoAnticipo, id, id_tenant]
    );

    await connection.commit();
    res.json({
      success: true,
      message: "Anticipo aplicado",
      data: { saldo_disponible: nuevoSaldoAnticipo, saldo_cuenta: nuevoSaldoCxp },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en aplicarAnticipo:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = { getAnticipos, crearAnticipo, aplicarAnticipo };
