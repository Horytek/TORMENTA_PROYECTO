import { obtenerEstadoIntegraciones } from "../services/integraciones/integracionesService.js";

/**
 * Estado de las integraciones del tenant. Código nuevo → `{ success, data }`.
 *
 * El tenant y la empresa salen SIEMPRE del JWT (`req.id_tenant`/`req.id_empresa`),
 * nunca de la query: si se aceptara un id por parámetro, un admin podría pedir
 * el diagnóstico de otra empresa.
 */
const obtenerEstado = async (req, res) => {
  try {
    const datos = await obtenerEstadoIntegraciones({
      id_tenant: req.id_tenant,
      id_empresa: req.id_empresa,
    });
    res.json({ success: true, data: datos });
  } catch (error) {
    // El error real puede describir el esquema de cifrado o la conexión: se
    // registra en el servidor y al cliente le llega un mensaje neutro.
    console.error("Error en obtenerEstadoIntegraciones:", error);
    res.status(500).json({
      success: false,
      code: "INTEGRACIONES_ERROR",
      message: "No se pudo obtener el estado de las integraciones",
    });
  }
};

export const methods = { obtenerEstado };
