import { getConnection } from "../database/database.js";
import { esErrorDeStock } from "../services/inventario/errores.js";
import { logInventario } from "../utils/logActions.js";
import { crearSalidaCore } from "./notasalida.controller.js";
import { crearIngresoCore } from "./notaingreso.controller.js";

/**
 * Traslado entre almacenes (modo "Conjunto" del formulario de Notas de
 * Almacén): una salida + un ingreso en UNA sola transacción.
 *
 * Antes el frontend llamaba a `insertNotaSalida` y luego a `insertNotaIngreso`
 * como dos peticiones HTTP independientes — si el ingreso fallaba después de
 * que la salida ya había descontado stock, esas unidades quedaban perdidas
 * (ni en el almacén de origen ni en el de destino). Este endpoint reusa el
 * mismo núcleo de ambos flujos (`crearSalidaCore`/`crearIngresoCore`) sobre
 * una única conexión: si cualquiera de los dos falla, se revierte todo.
 */
const insertTransferencia = async (req, res) => {
  const {
    almacenO, almacenD, destinatario, glosa, nota, fecha, observacion,
    producto, cantidad, tonalidad, talla, sku,
    numComprobanteSalida, numComprobanteIngreso, usuario,
  } = req.body;
  const id_tenant = req.id_tenant;

  if (
    !almacenO || !almacenD || !destinatario || !glosa || !nota || !fecha ||
    !producto || !cantidad || !numComprobanteSalida || !numComprobanteIngreso || !usuario
  ) {
    return res.status(400).json({ code: 0, message: "Faltan campos requeridos para la transferencia." });
  }

  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const salida = await crearSalidaCore(connection, {
      almacenO, destinatario, glosa, nota, fecha, producto,
      numComprobante: numComprobanteSalida, cantidad, observacion, nom_usuario: usuario,
      tonalidad, talla, sku, id_tenant,
    });

    const ingreso = await crearIngresoCore(connection, {
      almacenD, destinatario, glosa, nota, fecha, producto,
      numComprobante: numComprobanteIngreso, cantidad, observacion, usuario,
      tonalidad, talla, sku, id_tenant, id_empresa: req.id_empresa,
    });

    await connection.commit();

    // Logs de auditoría: best-effort, no revierten la transferencia si fallan.
    const ip = req.ip || req.connection.remoteAddress || req.socket?.remoteAddress || null;
    if (salida.id_usuario && id_tenant) {
      await logInventario.notaSalida(salida.id_nota, salida.id_usuario, ip, id_tenant).catch(() => {});
    }
    if (ingreso.id_usuario && id_tenant) {
      await logInventario.notaIngreso(ingreso.id_nota, ingreso.id_usuario, ip, id_tenant).catch(() => {});
    }

    res.json({
      code: 1,
      message: "Transferencia registrada correctamente",
      data: { id_nota_salida: salida.id_nota, id_nota_ingreso: ingreso.id_nota },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (esErrorDeStock(error)) {
      return res.status(409).json({ code: 0, codigo: error.codigo, message: error.message });
    }
    console.error("Error en insertTransferencia:", error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = { insertTransferencia };
