import { getConnection } from "../database/database.js";
import * as repo from "../services/sunat/cpeRepository.js";
import {
  emitirComprobanteDesdeVenta,
  reintentarComprobante,
} from "../services/sunat/cpeEmisionService.js";
import { ErrorCpe, CATEGORIAS } from "../services/sunat/cpeErrores.js";

/**
 * API de comprobantes electrónicos (CPE).
 * Código nuevo → forma de respuesta estándar `{ success, data }` / `{ success, code, message }`.
 */

/** Traduce la categoría del error al status HTTP correcto. */
const statusPorCategoria = (categoria) => {
  switch (categoria) {
    case CATEGORIAS.VALIDACION: return 422;
    case CATEGORIAS.CONFIG: return 422;
    case CATEGORIAS.RECHAZO: return 422;
    case CATEGORIAS.INCIERTO: return 409;
    default: return 502; // RED / SUNAT_SISTEMA / DESCONOCIDO
  }
};

const responderError = (res, error, contexto) => {
  if (error instanceof ErrorCpe) {
    const status = error.codigo === "CPE_EN_PROCESO" ? 409 : statusPorCategoria(error.categoria);
    return res.status(status).json({ success: false, code: error.codigo, message: error.message });
  }
  console.error(`Error en ${contexto}:`, error);
  return res.status(500).json({ success: false, code: "CPE_ERROR_INTERNO", message: "Error interno del servidor" });
};

/** Nombre de archivo seguro para el header Content-Disposition. */
const sanearNombre = (nombre) => String(nombre || "comprobante").replace(/[^A-Za-z0-9._-]/g, "");

const listarComprobantes = async (req, res) => {
  let connection;
  try {
    const { estado, tipo_doc, desde, hasta, q, page = 1, limit = 25 } = req.query;
    const tamanio = Math.min(Number(limit) || 25, 100);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * tamanio;

    connection = await getConnection();
    const { items, total } = await repo.listarCpe(connection, {
      id_tenant: req.id_tenant,
      estado, tipo_doc, desde, hasta, q,
      limit: tamanio,
      offset,
    });

    res.json({ success: true, data: { items, total, page: Number(page) || 1, limit: tamanio } });
  } catch (error) {
    responderError(res, error, "listarComprobantes");
  } finally {
    if (connection) connection.release();
  }
};

const obtenerResumen = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const resumen = await repo.obtenerResumen(connection, {
      id_tenant: req.id_tenant,
      desde: req.query.desde,
      hasta: req.query.hasta,
    });
    const sinEmitir = await repo.listarVentasSinCpe(connection, {
      id_tenant: req.id_tenant,
      desde: req.query.desde,
      hasta: req.query.hasta,
      limit: 500,
    });
    res.json({ success: true, data: { ...resumen, sin_emitir: sinEmitir.length } });
  } catch (error) {
    responderError(res, error, "obtenerResumen");
  } finally {
    if (connection) connection.release();
  }
};

const listarPendientes = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const items = await repo.listarVentasSinCpe(connection, {
      id_tenant: req.id_tenant,
      desde: req.query.desde,
      hasta: req.query.hasta,
      limit: Math.min(Number(req.query.limit) || 50, 200),
    });
    res.json({ success: true, data: items });
  } catch (error) {
    responderError(res, error, "listarPendientes");
  } finally {
    if (connection) connection.release();
  }
};

const obtenerComprobante = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cpe = await repo.obtenerCpePorId(connection, {
      id_tenant: req.id_tenant,
      id_cpe: req.params.id,
    });
    if (!cpe) {
      return res.status(404).json({ success: false, code: "CPE_NO_ENCONTRADO", message: "Comprobante no encontrado" });
    }

    const intentos = await repo.listarIntentos(connection, {
      id_tenant: req.id_tenant,
      id_cpe: cpe.id_cpe,
    });

    // Nunca se devuelven los blobs acá: se descargan por su propia ruta.
    const { sunat_notas_json, ...cabecera } = cpe;
    res.json({
      success: true,
      data: {
        ...cabecera,
        notas: sunat_notas_json ? (typeof sunat_notas_json === "string" ? JSON.parse(sunat_notas_json) : sunat_notas_json) : [],
        intentos,
      },
    });
  } catch (error) {
    responderError(res, error, "obtenerComprobante");
  } finally {
    if (connection) connection.release();
  }
};

const obtenerPorVenta = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cpe = await repo.obtenerCpePorVenta(connection, {
      id_tenant: req.id_tenant,
      id_venta: req.params.id_venta,
    });
    res.json({ success: true, data: cpe });
  } catch (error) {
    responderError(res, error, "obtenerPorVenta");
  } finally {
    if (connection) connection.release();
  }
};

const emitir = async (req, res) => {
  try {
    const { id_venta } = req.body;
    if (!id_venta) {
      return res.status(400).json({ success: false, code: "CPE_FALTA_VENTA", message: "Falta id_venta" });
    }

    const resultado = await emitirComprobanteDesdeVenta({
      id_venta,
      id_tenant: req.id_tenant,
      id_empresa: req.id_empresa,
      id_usuario: req.user?.id_usuario ?? req.id_usuario ?? null,
      ip: req.ip,
      idempotencyKey: req.get("Idempotency-Key") || null,
      simular: req.body.simular === true,
    });

    res.json({ success: true, data: resultado });
  } catch (error) {
    responderError(res, error, "emitir");
  }
};

const reintentar = async (req, res) => {
  try {
    const resultado = await reintentarComprobante({
      id_cpe: req.params.id,
      id_tenant: req.id_tenant,
      id_empresa: req.id_empresa,
      id_usuario: req.user?.id_usuario ?? req.id_usuario ?? null,
      ip: req.ip,
    });
    res.json({ success: true, data: resultado });
  } catch (error) {
    responderError(res, error, "reintentar");
  }
};

/** Descarga del XML firmado o del CDR. Ambos filtran por tenant. */
const descargarArchivo = (tipo) => async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const cpe = await repo.obtenerCpePorId(connection, { id_tenant: req.id_tenant, id_cpe: req.params.id });
    if (!cpe) {
      return res.status(404).json({ success: false, code: "CPE_NO_ENCONTRADO", message: "Comprobante no encontrado" });
    }

    const archivos = await repo.obtenerArchivos(connection, { id_tenant: req.id_tenant, id_cpe: cpe.id_cpe });
    const nombre = sanearNombre(cpe.nombre_archivo);

    if (tipo === "xml") {
      if (!archivos?.xml_firmado) {
        return res.status(404).json({ success: false, code: "CPE_SIN_XML", message: "Este comprobante no tiene XML almacenado" });
      }
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${nombre}.xml"`);
      return res.send(archivos.xml_firmado);
    }

    if (!archivos?.cdr_xml && !archivos?.cdr_zip) {
      return res.status(404).json({ success: false, code: "CPE_SIN_CDR", message: "Este comprobante no tiene CDR almacenado" });
    }

    if (req.query.formato === "zip" && archivos.cdr_zip) {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="R-${nombre}.zip"`);
      return res.send(archivos.cdr_zip);
    }

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="R-${nombre}.xml"`);
    return res.send(archivos.cdr_xml);
  } catch (error) {
    responderError(res, error, "descargarArchivo");
  } finally {
    if (connection) connection.release();
  }
};

export const methods = {
  listarComprobantes,
  obtenerResumen,
  listarPendientes,
  obtenerComprobante,
  obtenerPorVenta,
  emitir,
  reintentar,
  descargarXml: descargarArchivo("xml"),
  descargarCdr: descargarArchivo("cdr"),
};
