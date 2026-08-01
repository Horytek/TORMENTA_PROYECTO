import crypto from "crypto";
import { getConnection } from "../../database/database.js";
import { getSunatConfigByEmpresa } from "./sunatConfig.js";
import { getSigningMaterialFromConfig } from "./sunatCertificate.js";
import { signUblXml } from "./sunatXmlSign.js";
import { zipXml, unzipSingleFile } from "./sunatZip.js";
import { sunatSendBill } from "./sunatSoapClient.js";
import {
  buildInvoiceXmlFromApiPeruPayload,
  buildSunatFileNameFromPayload,
} from "./ublInvoiceBuilder.js";
import { construirPayloadDesdeVenta } from "./cpeVentaMapper.js";
import { parseCdrSummary, clasificarResponseCode, ESTADOS_CPE, ESTADOS_ACEPTADOS } from "./cpeCdr.js";
import { ErrorCpe, CATEGORIAS, categorizarErrorSunat } from "./cpeErrores.js";
import * as repo from "./cpeRepository.js";
import { logSunat, logComprobantes } from "../../utils/logActions.js";

/**
 * Emisión de comprobantes electrónicos DESDE EL SERVIDOR.
 *
 * Diferencias de fondo con el flujo actual (`/api/sunat/cpe/invoice/emit`):
 *  1. Recibe `id_venta` y reconstruye todo desde la BD. El navegador ya no
 *     decide importes, serie ni RUC del emisor.
 *  2. Persiste XML firmado, CDR y estado real (obligación de conservación).
 *  3. El estado sale del ResponseCode del CDR, no del status HTTP.
 *  4. Es idempotente: reemitir no duplica el comprobante ni reenvía a SUNAT.
 *
 * La transacción NUNCA queda abierta mientras se llama a SUNAT: se persiste
 * antes, se envía fuera de transacción, y se persiste el resultado después.
 */

const sha256 = (contenido) =>
  crypto.createHash("sha256").update(contenido ?? "", "utf8").digest("hex");

/**
 * Ejecuta trabajo de BD tomando y devolviendo la conexión al pool enseguida.
 *
 * CRÍTICO: el pool (`src/database/database.js`) tiene un watchdog que cada 60 s
 * hace KILL de las conexiones dormidas más de 30 s. Una llamada a SUNAT puede
 * tardar minutos (throttle de 3 s + hasta 5 reintentos con backoff), así que
 * sostener la conexión durante el envío la deja muerta y luego NO se puede
 * persistir el resultado. Por eso el envío ocurre SIN conexión tomada.
 */
async function conDb(trabajo) {
  const cx = await getConnection();
  try {
    return await trabajo(cx);
  } finally {
    cx.release();
  }
}

/** DigestValue del XML firmado: es el "hash del CPE" que va en el QR del PDF. */
const extraerHashCpe = (xmlFirmado) =>
  /<ds:DigestValue>([^<]+)<\/ds:DigestValue>/i.exec(xmlFirmado || "")?.[1] ?? null;

/**
 * Mensaje legible de un fallo de SUNAT.
 *
 * El cliente SOAP lanza objetos `{Fault, response, body}` SIN `.message`, así
 * que un `error.message` pelado llega vacío y el operador no sabe qué pasó.
 * Se rescata, en orden: el faultstring, el status HTTP, o un extracto del body.
 */
function describirError(error) {
  if (error?.message) return String(error.message).slice(0, 480);

  const fault = error?.Fault || error?.root?.Envelope?.Body?.Fault;
  const faultString = fault?.faultstring || fault?.Reason?.Text || fault?.detail?.message;
  if (faultString) return String(faultString).slice(0, 480);

  const status = error?.response?.status ?? error?.response?.statusCode;
  const cuerpo = String(error?.body || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  if (status === 401) {
    return "SUNAT rechazó la autenticación (HTTP 401). Revisa el usuario y la clave SOL de la empresa.";
  }
  if (status) return `SUNAT respondió HTTP ${status}${cuerpo ? `: ${cuerpo.slice(0, 200)}` : ""}`;
  if (cuerpo) return cuerpo.slice(0, 300);

  return "SUNAT no devolvió un mensaje de error legible.";
}

/**
 * Impide emitir contra producción desde una máquina de desarrollo: un
 * comprobante emitido en producción es un documento fiscal REAL.
 */
function verificarEntornoSeguro(config) {
  const esProduccion = String(config?.env || "").toLowerCase().startsWith("prod");
  if (!esProduccion) return;

  const host = String(process.env.DB_HOST || "").trim().toLowerCase();
  const esLocal = ["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(host);

  if (esLocal && process.env.CPE_PERMITIR_PROD !== "1") {
    throw new ErrorCpe(
      "CPE_ENTORNO_PRODUCCION",
      "Bloqueado: la empresa está configurada en producción y esto correría desde una base local. " +
        "Emitiría comprobantes fiscales reales. Usa el entorno beta o define CPE_PERMITIR_PROD=1 a conciencia.",
      { categoria: CATEGORIAS.CONFIG }
    );
  }
}

/** Credenciales + certificado de la empresa (desde la tabla `clave`). */
async function resolverConfiguracion({ id_empresa, id_tenant, ruc }) {
  if (!id_empresa || !id_tenant) {
    throw new ErrorCpe("CPE_CONFIG_INCOMPLETA", "Falta la empresa o el tenant para emitir.", {
      categoria: CATEGORIAS.CONFIG,
    });
  }

  const config = await getSunatConfigByEmpresa(id_empresa, id_tenant, ruc);

  if (!config?.credentials?.username || !config?.credentials?.password) {
    throw new ErrorCpe(
      "CPE_SIN_CREDENCIALES",
      "La empresa no tiene credenciales SOL configuradas.",
      { categoria: CATEGORIAS.CONFIG }
    );
  }
  if (!config?.certificate?.p12Buffer) {
    throw new ErrorCpe(
      "CPE_SIN_CERTIFICADO",
      "La empresa no tiene cargado el certificado digital (.p12).",
      { categoria: CATEGORIAS.CONFIG }
    );
  }

  verificarEntornoSeguro(config);
  return { config, ...getSigningMaterialFromConfig(config) };
}

/**
 * Emite el comprobante de una venta.
 *
 * @returns {Promise<{id_cpe:number, estado:string, yaEmitido:boolean, responseCode?:string,
 *   descripcion?:string, notas?:string[], nombreArchivo?:string, intentos?:number}>}
 */
export async function emitirComprobanteDesdeVenta({
  id_venta,
  id_tenant,
  id_empresa,
  id_usuario = null,
  ip = null,
  idempotencyKey = null,
  simular = false,
}) {
  let idCpe = null;
  let intentoActual = 1;
  let yaSeEnvio = false;

  try {
    // ── FASE A: todo el trabajo de BD previo (conexión tomada y devuelta) ──
    const preparacion = await conDb(async (cx) => {
    // ── 1. Cortocircuito de idempotencia ────────────────────────────────
    const existente = await repo.obtenerCpePorVenta(cx, { id_tenant, id_venta });
    if (existente && ESTADOS_ACEPTADOS.has(existente.estado)) {
      return {
        id_cpe: existente.id_cpe,
        estado: existente.estado,
        yaEmitido: true,
        responseCode: existente.sunat_response_code,
        descripcion: existente.sunat_descripcion,
        nombreArchivo: existente.nombre_archivo,
        intentos: existente.intentos,
      };
    }
    if (existente && existente.estado === ESTADOS_CPE.ENVIANDO && existente.lock_expira_en > new Date()) {
      throw new ErrorCpe("CPE_EN_PROCESO", "El comprobante ya se está enviando a SUNAT.", {
        categoria: CATEGORIAS.VALIDACION,
      });
    }
    if (existente && existente.estado === ESTADOS_CPE.INCIERTO) {
      throw new ErrorCpe(
        "CPE_INCIERTO",
        "El envío anterior quedó sin confirmar: hay que consultar el estado en SUNAT antes de reintentar, " +
          "porque el comprobante podría haberse registrado.",
        { categoria: CATEGORIAS.INCIERTO }
      );
    }

    // ── 2. Leer la venta desde BD (nunca del cliente) ───────────────────
    const datos = await repo.obtenerDatosVenta(cx, { id_venta, id_tenant, id_empresa });
    if (!datos?.venta) {
      throw new ErrorCpe("CPE_VENTA_NO_ENCONTRADA", "No se encontró la venta.", {
        categoria: CATEGORIAS.VALIDACION,
      });
    }
    if (Number(datos.venta.estado_venta) !== 1) {
      throw new ErrorCpe("CPE_VENTA_ANULADA", "La venta está anulada: no se puede emitir.", {
        categoria: CATEGORIAS.VALIDACION,
      });
    }

    // ── 3. Construir y validar el payload ───────────────────────────────
    const { payload, tipoDoc, serie, correlativo, totales } = construirPayloadDesdeVenta(datos);
    const nombreArchivo = buildSunatFileNameFromPayload(payload);

    // ── 4. Configuración (valida entorno y credenciales) ────────────────
    const { config, privateKeyPem, certificatePem } = await resolverConfiguracion({
      id_empresa,
      id_tenant,
      ruc: payload.company.ruc,
    });

    // ── 5. Crear/recuperar la cabecera y reclamarla ─────────────────────
    idCpe = await repo.crearCpePendiente(cx, {
      id_tenant,
      id_empresa,
      id_venta,
      id_sucursal: datos.venta.id_sucursal,
      tipo_doc: tipoDoc,
      serie,
      correlativo,
      ruc_emisor: payload.company.ruc,
      nombre_archivo: nombreArchivo,
      fecha_emision: String(payload.fechaEmision).slice(0, 10),
      moneda: payload.tipoMoneda,
      mto_oper_gravadas: totales.mtoOperGravadas,
      mto_oper_exoneradas: totales.mtoOperExoneradas,
      mto_oper_inafectas: totales.mtoOperInafectas,
      mto_igv: totales.mtoIGV,
      mto_imp_venta: totales.mtoImpVenta,
      tipo_doc_cliente: payload.client.tipoDoc,
      num_doc_cliente: payload.client.numDoc,
      nombre_cliente: payload.client.rznSocial,
      sunat_env: config.env,
      origen: "SERVIDOR",
      idempotency_key: idempotencyKey,
      creado_por: id_usuario,
    });

    const reclamado = await repo.reclamarCpeParaEnvio(cx, {
      id_cpe: idCpe,
      id_tenant,
      lockToken: crypto.randomUUID(),
    });
    if (!reclamado) {
      throw new ErrorCpe(
        "CPE_EN_PROCESO",
        "Otro proceso está emitiendo este comprobante en este momento.",
        { categoria: CATEGORIAS.VALIDACION }
      );
    }

    const cpeActual = await repo.obtenerCpePorId(cx, { id_tenant, id_cpe: idCpe });
    intentoActual = cpeActual?.intentos ?? 1;

    // ── 6. Firmar y persistir el XML ANTES de enviar ────────────────────
    // Si el proceso muere en el envío, queda constancia exacta de qué se firmó.
    const xml = buildInvoiceXmlFromApiPeruPayload(payload);
    const xmlFirmado = signUblXml({ xml, privateKeyPem, certificatePem });
    await repo.guardarXmlFirmado(cx, {
      id_cpe: idCpe,
      id_tenant,
      xml: xmlFirmado,
      sha256: sha256(xmlFirmado),
      hashCpe: extraerHashCpe(xmlFirmado),
    });

      if (simular) {
        await repo.registrarResultadoEnvio(cx, {
          id_cpe: idCpe,
          id_tenant,
          estado: ESTADOS_CPE.PENDIENTE,
          error: "Simulación: se firmó pero no se envió a SUNAT.",
          categoriaError: null,
        });
      }

      return { listo: true, idCpe, nombreArchivo, xmlFirmado, config, tipoDoc };
    }); // fin FASE A — la conexión ya volvió al pool

    // Cortocircuito de idempotencia: la fase A ya devolvió el resultado final.
    if (preparacion?.yaEmitido) return preparacion;
    if (simular) {
      return { id_cpe: idCpe, estado: ESTADOS_CPE.PENDIENTE, yaEmitido: false, simulado: true, nombreArchivo: preparacion.nombreArchivo };
    }

    const { nombreArchivo, xmlFirmado, config, tipoDoc } = preparacion;

    // ── FASE B: enviar a SUNAT SIN conexión de BD tomada ────────────────
    // Puede tardar minutos (throttle + reintentos); el watchdog del pool mataría
    // cualquier conexión que dejáramos abierta durante este rato.
    // `zipXml` recibe el nombre BASE (le agrega .xml adentro), pero SUNAT exige
    // que el parámetro `fileName` del SOAP venga CON la extensión .zip: si no,
    // responde 0151 "El nombre del archivo ZIP es incorrecto".
    const zipBuffer = await zipXml({ fileName: nombreArchivo, xml: xmlFirmado });
    const inicio = Date.now();
    yaSeEnvio = true;
    const respuesta = await sunatSendBill({ fileName: `${nombreArchivo}.zip`, zipBuffer, config });
    const duracionMs = Date.now() - inicio;

    // ── FASE C: interpretar el CDR y persistir (conexión nueva) ─────────
    const cdrZip = Buffer.from(respuesta.applicationResponseBase64, "base64");
    const { content } = await unzipSingleFile({ zipBuffer: cdrZip });
    const cdrXml = Buffer.isBuffer(content) ? content.toString("utf8") : String(content);
    const resumen = parseCdrSummary(cdrXml);
    const clasificacion = clasificarResponseCode(resumen?.responseCode, resumen?.notes);

    await conDb(async (cx) => {
      await repo.guardarCdr(cx, { id_cpe: idCpe, id_tenant, cdrZip, cdrXml, sha256: sha256(cdrXml) });
      await repo.registrarResultadoEnvio(cx, {
        id_cpe: idCpe,
        id_tenant,
        estado: clasificacion.estado,
        responseCode: resumen?.responseCode ?? null,
        descripcion: resumen?.description ?? clasificacion.motivo,
        notas: resumen?.notes ?? [],
      });
      await repo.sincronizarEstadoVenta(cx, {
        id_venta,
        id_tenant,
        aceptado: ESTADOS_ACEPTADOS.has(clasificacion.estado),
      });
      await repo.registrarIntento(cx, {
        id_cpe: idCpe,
        id_tenant,
        intento: intentoActual,
        operacion: "SEND_BILL",
        resultado: clasificacion.estado,
        responseCode: resumen?.responseCode ?? null,
        mensaje: resumen?.description ?? null,
        duracionMs,
        id_usuario,
        ip,
      });
    });

    // ── Auditoría (helpers que ya existían sin usarse) ──────────────────
    try {
      await logSunat.enviar(id_venta, id_usuario, ip, id_tenant);
      if (ESTADOS_ACEPTADOS.has(clasificacion.estado)) {
        await logSunat.aceptada(id_venta, id_usuario, ip, id_tenant, resumen?.responseCode);
        await logComprobantes.emitir(idCpe, id_usuario, ip, id_tenant, tipoDoc);
      } else {
        await logSunat.rechazada(id_venta, id_usuario, ip, id_tenant, resumen?.description);
      }
    } catch { /* la auditoría nunca debe tumbar la emisión */ }

    return {
      id_cpe: idCpe,
      estado: clasificacion.estado,
      yaEmitido: false,
      responseCode: resumen?.responseCode ?? null,
      descripcion: resumen?.description ?? clasificacion.motivo,
      notas: resumen?.notes ?? [],
      nombreArchivo,
      intentos: intentoActual,
    };
  } catch (error) {
    // ── Manejo por categoría ────────────────────────────────────────────
    const categoria =
      error instanceof ErrorCpe ? error.categoria : categorizarErrorSunat(error, { yaSeEnvio });
    const mensajeError = describirError(error);

    if (idCpe) {
      const estado =
        categoria === CATEGORIAS.INCIERTO
          ? ESTADOS_CPE.INCIERTO
          : categoria === CATEGORIAS.RECHAZO
            ? ESTADOS_CPE.RECHAZADO
            : categoria === CATEGORIAS.CONFIG || categoria === CATEGORIAS.VALIDACION
              ? ESTADOS_CPE.ERROR_CONFIG
              : ESTADOS_CPE.ERROR_ENVIO;

      // Conexión NUEVA a propósito: la del envío pudo quedar inservible.
      try {
        await conDb(async (cx) => {
          await repo.registrarResultadoEnvio(cx, {
            id_cpe: idCpe,
            id_tenant,
            estado,
            error: mensajeError,
            categoriaError: categoria,
          });
          await repo.registrarIntento(cx, {
            id_cpe: idCpe,
            id_tenant,
            intento: intentoActual,
            operacion: "SEND_BILL",
            resultado: estado,
            mensaje: mensajeError,
            id_usuario,
            ip,
          });
        });
      } catch (errorPersistencia) {
        console.error("[cpe] No se pudo persistir el fallo:", errorPersistencia.message);
      }
    }

    if (error instanceof ErrorCpe) throw error;
    throw new ErrorCpe("CPE_ERROR_SUNAT", mensajeError, { categoria, causa: error });
  }
}

/** Reintento explícito. Solo desde estados reintentables. */
export async function reintentarComprobante({ id_cpe, id_tenant, id_empresa, id_usuario = null, ip = null }) {
  const cx = await getConnection();
  let cpe;
  try {
    cpe = await repo.obtenerCpePorId(cx, { id_tenant, id_cpe });
  } finally {
    cx.release();
  }

  if (!cpe) {
    throw new ErrorCpe("CPE_NO_ENCONTRADO", "No se encontró el comprobante.", {
      categoria: CATEGORIAS.VALIDACION,
    });
  }
  if (ESTADOS_ACEPTADOS.has(cpe.estado)) {
    return { id_cpe: cpe.id_cpe, estado: cpe.estado, yaEmitido: true, nombreArchivo: cpe.nombre_archivo };
  }
  if (cpe.estado === ESTADOS_CPE.RECHAZADO) {
    throw new ErrorCpe(
      "CPE_RECHAZADO_NO_REINTENTABLE",
      "SUNAT rechazó este comprobante: hay que corregir los datos y emitir con un correlativo nuevo.",
      { categoria: CATEGORIAS.RECHAZO }
    );
  }

  return emitirComprobanteDesdeVenta({
    id_venta: cpe.id_venta,
    id_tenant,
    id_empresa: id_empresa ?? cpe.id_empresa,
    id_usuario,
    ip,
  });
}

export default { emitirComprobanteDesdeVenta, reintentarComprobante };
