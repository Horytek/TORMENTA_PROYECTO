import { getSunatConfig, getSunatConfigByEmpresa } from '../services/sunat/sunatConfig.js';
import { zipXml, unzipSingleFile } from '../services/sunat/sunatZip.js';
import {
  sunatGetStatus,
  sunatSendBill,
  sunatSendPack,
  sunatSendSummary,
} from '../services/sunat/sunatSoapClient.js';
import { getSigningMaterialFromP12Env, getSigningMaterialFromConfig } from '../services/sunat/sunatCertificate.js';
import { signUblXml } from '../services/sunat/sunatXmlSign.js';
import { getConnection } from '../database/database.js';
import {
  buildInvoiceXmlFromApiPeruPayload,
  buildSunatFileNameFromPayload,
} from '../services/sunat/ublInvoiceBuilder.js';
import {
  buildDespatchXmlFromApiPeruPayload,
  buildSunatGreFileNameFromPayload,
} from '../services/sunat/ublDespatchBuilder.js';
import { sunatGreSendBill } from '../services/sunat/sunatGreSoapClient.js';
import {
  buildVoidedXmlFromApiPeruPayload,
  buildSunatVoidedFileNameFromPayload,
} from '../services/sunat/ublVoidedBuilder.js';
import {
  buildSummaryXmlFromApiPeruPayload,
  buildSunatSummaryFileNameFromPayload,
} from '../services/sunat/ublSummaryBuilder.js';
import { generateInvoicePdf, generateDespatchPdf } from '../services/sunat/sunatPdfGenerator.js';

function toXmlFromBody(body) {
  if (typeof body?.xml === 'string' && body.xml.trim()) return body.xml;
  if (typeof body?.xmlBase64 === 'string' && body.xmlBase64.trim()) {
    return Buffer.from(body.xmlBase64, 'base64').toString('utf8');
  }
  return null;
}

function parseCdrSummary(cdrXml) {
  if (!cdrXml) return null;
  const responseCode = /<cbc:ResponseCode>([^<]+)<\/cbc:ResponseCode>/i.exec(cdrXml)?.[1] ?? null;
  const description = /<cbc:Description>([\s\S]*?)<\/cbc:Description>/i.exec(cdrXml)?.[1]?.trim() ?? null;
  const notes = Array.from(cdrXml.matchAll(/<cbc:Note>([\s\S]*?)<\/cbc:Note>/gi)).map((m) => m[1].trim());
  return { responseCode, description, notes };
}

/**
 * Obtener configuración SUNAT y material de firma por empresa
 * Lee de BD si hay config, sino usa variables de entorno como fallback
 * 
 * FLUJO:
 * 1. Usa id_empresa y id_tenant del token JWT (req.id_empresa, req.id_tenant)
 * 2. Si no hay id_empresa en el token, busca por RUC del payload
 * 3. Fallback a variables de entorno solo para desarrollo
 */
async function getConfigAndSigningMaterial(req, payload) {
  const id_tenant = req.id_tenant;
  const ruc = payload?.company?.ruc;

  // Primero: usar id_empresa del token JWT (viene del usuario logueado)
  // Asegurarnos de que sea un valor válido (no null, undefined, 0, "")
  let id_empresa = req.id_empresa && req.id_empresa !== "" ? req.id_empresa : null;

  console.log(`[SunatController] Auth context: id_empresa=${id_empresa}, id_tenant=${id_tenant}, RUC=${ruc}, req.id_empresa=${req.id_empresa}`);

  // Si no hay id_empresa en el token, buscar por RUC
  if (!id_empresa && ruc) {
    console.log(`[SunatController] No id_empresa in token, searching by RUC=${ruc}`);
    let connection;
    try {
      connection = await getConnection();
      // Buscar por RUC sin filtrar por tenant (el RUC es único globalmente)
      const [rows] = await connection.query(
        'SELECT id_empresa, id_tenant FROM empresa WHERE ruc = ? LIMIT 1',
        [ruc]
      );
      if (rows.length > 0) {
        id_empresa = rows[0].id_empresa;
        console.log(`[SunatController] Found id_empresa=${id_empresa} for RUC=${ruc}`);
      } else {
        console.warn(`[SunatController] No company found for RUC=${ruc}`);
      }
    } finally {
      if (connection) connection.release();
    }
  }

  // Intentar cargar config de BD
  if (id_empresa && ruc) {
    try {
      console.log(`[SunatController] Loading SUNAT config for id_empresa=${id_empresa}, id_tenant=${id_tenant}, RUC=${ruc}`);
      const config = await getSunatConfigByEmpresa(id_empresa, id_tenant, ruc);
      console.log(`[SunatController] Config loaded: user=${config.credentials?.username ? 'OK' : 'MISSING'}, pass=${config.credentials?.password ? 'OK' : 'MISSING'}, cert=${config.certificate?.p12Buffer ? 'OK' : 'MISSING'}`);

      // Validar que haya credenciales SOL
      if (!config.credentials?.username || !config.credentials?.password) {
        throw new Error(`Faltan credenciales SUNAT. Configure las credenciales SOL en la configuración de la empresa.`);
      }

      // Validar que haya certificado
      if (!config.certificate?.p12Buffer) {
        throw new Error(`Falta el certificado digital SUNAT. Configure el certificado .p12 en la configuración de la empresa.`);
      }

      const signingMaterial = getSigningMaterialFromConfig(config);
      return { config, ...signingMaterial };
    } catch (e) {
      // Propagar errores de configuración
      if (e.message.includes('Credenciales') || e.message.includes('Certificado') || e.message.includes('certificado') || e.message.includes('configurad') || e.message.includes('Falta')) {
        throw e;
      }
      console.warn('Config BD no disponible:', e.message);
      throw new Error(`Error al obtener configuración SUNAT: ${e.message}`);
    }
  }

  // No se encontró empresa
  if (!id_empresa) {
    if (ruc) {
      throw new Error(`Empresa con RUC ${ruc} no encontrada en el sistema.`);
    } else {
      throw new Error('No se pudo determinar la empresa. Verifique que esté logueado correctamente.');
    }
  }

  // Fallback: usar variables de entorno (solo para desarrollo)
  try {
    console.log('[SunatController] Fallback: usando configuración de variables de entorno');
    const config = getSunatConfig();
    const signingMaterial = await getSigningMaterialFromP12Env();
    return { config, ...signingMaterial };
  } catch (e) {
    throw new Error('Configuración SUNAT incompleta. Configura las credenciales desde Configuración > SUNAT.');
  }
}

export const methods = {
  getConfig: async (_req, res) => {
    try {
      const cfg = getSunatConfig();
      // No exponer password
      res.json({
        ok: true,
        env: cfg.env,
        billWsdlUrl: cfg.billWsdlUrl,
        credentials: {
          ruc: cfg.credentials.ruc,
          username: cfg.credentials.username ? '***' : '',
        },
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  sendBill: async (req, res) => {
    try {
      const { fileName } = req.body || {};
      const xml = toXmlFromBody(req.body);
      if (!fileName) return res.status(400).json({ ok: false, message: 'fileName es requerido' });
      if (!xml) return res.status(400).json({ ok: false, message: 'xml o xmlBase64 es requerido' });

      const zipBuffer = await zipXml({ fileName, xml });
      const result = await sunatSendBill({ fileName: `${fileName}.zip`, zipBuffer });

      const cdrZipBase64 = result.applicationResponseBase64 || null;
      let cdrXmlBase64 = null;
      let cdrXmlFileName = null;
      let cdrSummary = null;

      if (cdrZipBase66) {
        const { fileName: f, content } = await unzipSingleFile({
          zipBuffer: Buffer.from(cdrZipBase64, 'base64'),
        });
        cdrXmlFileName = f;
        cdrXmlBase64 = content.toString('base64');
        cdrSummary = parseCdrSummary(content.toString('utf8'));
      }

      res.json({
        ok: true,
        fileName,
        cdrZipBase64,
        cdrXmlFileName,
        cdrXmlBase64,
        cdrSummary,
        raw: result.raw,
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  buildAndSendInvoice: async (req, res) => {
    try {
      const payload = req.body;

      // Debug: ver qué tiene el req.user del token
      console.log(`[SunatController] buildAndSendInvoice - req.user:`, JSON.stringify(req.user || {}, null, 2));
      console.log(`[SunatController] buildAndSendInvoice - req.id_empresa=${req.id_empresa}, req.id_tenant=${req.id_tenant}`);
      
      // Debug: ver los details del payload
      console.log(`[SunatController] Payload details:`, JSON.stringify(payload.details || [], null, 2));

      // Sanitize correlativo: SUNAT requires purely numeric correlativo in filename (padded to 8)
      // If client sends 'B001-0000001', we strip the prefix.
      if (payload.correlativo && String(payload.correlativo).includes('-')) {
        const parts = String(payload.correlativo).split('-');
        const cleanCorrelativo = parts[parts.length - 1];
        console.warn(`[SunatController] Sanitizing correlativo: ${payload.correlativo} -> ${cleanCorrelativo}`);
        payload.correlativo = cleanCorrelativo;
      }

      const fileNameBase = buildSunatFileNameFromPayload(payload);
      const xmlUnsigned = buildInvoiceXmlFromApiPeruPayload(payload);

      const { config, privateKeyPem, certificatePem } = await getConfigAndSigningMaterial(req, payload);
      const xmlSigned = signUblXml({ xml: xmlUnsigned, privateKeyPem, certificatePem });

      const zipBuffer = await zipXml({ fileName: fileNameBase, xml: xmlSigned });
      const result = await sunatSendBill({ fileName: `${fileNameBase}.zip`, zipBuffer, config });

      const cdrZipBase64 = result.applicationResponseBase64 || null;
      let cdrXmlBase64 = null;
      let cdrXmlFileName = null;
      let cdrSummary = null;

      if (cdrZipBase64) {
        const { fileName: f, content } = await unzipSingleFile({
          zipBuffer: Buffer.from(cdrZipBase64, 'base64'),
        });
        cdrXmlFileName = f;
        cdrXmlBase64 = content.toString('base64');
        cdrSummary = parseCdrSummary(content.toString('utf8'));
      }

      res.json({
        ok: true,
        fileName: fileNameBase,
        xmlSignedBase64: Buffer.from(xmlSigned, 'utf8').toString('base64'),
        cdrZipBase64,
        cdrXmlFileName,
        cdrXmlBase64,
        cdrSummary,
        raw: result.raw,
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  buildAndSignInvoice: async (req, res) => {
    try {
      const payload = req.body;
      const fileNameBase = buildSunatFileNameFromPayload(payload);
      const xmlUnsigned = buildInvoiceXmlFromApiPeruPayload(payload);

      const { privateKeyPem, certificatePem } = await getConfigAndSigningMaterial(req, payload);
      const xmlSigned = signUblXml({ xml: xmlUnsigned, privateKeyPem, certificatePem });

      res.json({
        ok: true,
        fileName: fileNameBase,
        xmlUnsignedBase64: Buffer.from(xmlUnsigned, 'utf8').toString('base64'),
        xmlSignedBase64: Buffer.from(xmlSigned, 'utf8').toString('base64'),
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  sendSummary: async (req, res) => {
    try {
      const { fileName } = req.body || {};
      const xml = toXmlFromBody(req.body);
      if (!fileName) return res.status(400).json({ ok: false, message: 'fileName es requerido' });
      if (!xml) return res.status(400).json({ ok: false, message: 'xml o xmlBase64 es requerido' });

      const zipBuffer = await zipXml({ fileName, xml });
      const result = await sunatSendSummary({ fileName: `${fileName}.zip`, zipBuffer });

      res.json({ ok: true, fileName, ticket: result.ticket, raw: result.raw });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  sendPack: async (req, res) => {
    try {
      const { fileName } = req.body || {};
      const xml = toXmlFromBody(req.body);
      if (!fileName) return res.status(400).json({ ok: false, message: 'fileName es requerido' });
      if (!xml) return res.status(400).json({ ok: false, message: 'xml o xmlBase64 es requerido' });

      const zipBuffer = await zipXml({ fileName, xml });
      const result = await sunatSendPack({ fileName: `${fileName}.zip`, zipBuffer });

      res.json({ ok: true, fileName, ticket: result.ticket, raw: result.raw });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  getStatus: async (req, res) => {
    try {
      const ticket = req.params.ticket;
      const result = await sunatGetStatus({ ticket });

      let cdrZipBase64 = result.contentBase64 || null;
      let cdrXmlBase64 = null;
      let cdrXmlFileName = null;
      let cdrSummary = null;

      if (cdrZipBase64) {
        const { fileName: f, content } = await unzipSingleFile({
          zipBuffer: Buffer.from(cdrZipBase64, 'base64'),
        });
        cdrXmlFileName = f;
        cdrXmlBase64 = content.toString('base64');
        cdrSummary = parseCdrSummary(content.toString('utf8'));
      }

      res.json({
        ok: true,
        ticket,
        statusCode: result.statusCode,
        statusMessage: result.statusMessage,
        cdrZipBase64,
        cdrXmlFileName,
        cdrXmlBase64,
        cdrSummary,
        raw: result.raw,
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  buildAndSignGre: async (req, res) => {
    try {
      const payload = req.body;
      const fileNameBase = buildSunatGreFileNameFromPayload(payload);
      const xmlUnsigned = buildDespatchXmlFromApiPeruPayload(payload);

      const { privateKeyPem, certificatePem } = await getConfigAndSigningMaterial(req, payload);
      const xmlSigned = signUblXml({
        xml: xmlUnsigned,
        privateKeyPem,
        certificatePem,
        referenceXPath: "//*[local-name()='DespatchAdvice']",
      });

      res.json({
        ok: true,
        fileName: fileNameBase,
        xmlUnsignedBase64: Buffer.from(xmlUnsigned, 'utf8').toString('base64'),
        xmlSignedBase64: Buffer.from(xmlSigned, 'utf8').toString('base64'),
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  emitGre: async (req, res) => {
    try {
      const payload = req.body;
      const fileNameBase = buildSunatGreFileNameFromPayload(payload);
      const xmlUnsigned = buildDespatchXmlFromApiPeruPayload(payload);

      const { config, privateKeyPem, certificatePem } = await getConfigAndSigningMaterial(req, payload);
      const xmlSigned = signUblXml({
        xml: xmlUnsigned,
        privateKeyPem,
        certificatePem,
        referenceXPath: "//*[local-name()='DespatchAdvice']",
      });

      const zipBuffer = await zipXml({ fileName: fileNameBase, xml: xmlSigned });
      const result = await sunatGreSendBill({ fileName: `${fileNameBase}.zip`, zipBuffer, config });

      const cdrZipBase64 = result.applicationResponseBase64 || null;
      let cdrXmlBase64 = null;
      let cdrXmlFileName = null;
      let cdrSummary = null;

      if (cdrZipBase64) {
        const { fileName: f, content } = await unzipSingleFile({
          zipBuffer: Buffer.from(cdrZipBase64, 'base64'),
        });
        cdrXmlFileName = f;
        cdrXmlBase64 = content.toString('base64');
        cdrSummary = parseCdrSummary(content.toString('utf8'));
      }

      res.json({
        ok: true,
        fileName: fileNameBase,
        xmlSignedBase64: Buffer.from(xmlSigned, 'utf8').toString('base64'),
        cdrZipBase64,
        cdrXmlFileName,
        cdrXmlBase64,
        cdrSummary,
        raw: result.raw,
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  // ===== COMUNICACIÓN DE BAJA (Voided) =====
  buildAndSendVoided: async (req, res) => {
    try {
      const payload = req.body;
      const fileNameBase = buildSunatVoidedFileNameFromPayload(payload);
      const xmlUnsigned = buildVoidedXmlFromApiPeruPayload(payload);

      const { config, privateKeyPem, certificatePem } = await getConfigAndSigningMaterial(req, payload);
      const xmlSigned = signUblXml({
        xml: xmlUnsigned,
        privateKeyPem,
        certificatePem,
        referenceXPath: "//*[local-name()='VoidedDocuments']",
      });

      const zipBuffer = await zipXml({ fileName: fileNameBase, xml: xmlSigned });
      const result = await sunatSendSummary({ fileName: `${fileNameBase}.zip`, zipBuffer, config });

      res.json({
        ok: true,
        fileName: fileNameBase,
        xmlSignedBase64: Buffer.from(xmlSigned, 'utf8').toString('base64'),
        ticket: result.ticket,
        raw: result.raw,
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  // ===== RESUMEN DIARIO (Summary) =====
  buildAndSendSummary: async (req, res) => {
    try {
      const payload = req.body;
      const fileNameBase = buildSunatSummaryFileNameFromPayload(payload);
      const xmlUnsigned = buildSummaryXmlFromApiPeruPayload(payload);

      const { config, privateKeyPem, certificatePem } = await getConfigAndSigningMaterial(req, payload);
      const xmlSigned = signUblXml({
        xml: xmlUnsigned,
        privateKeyPem,
        certificatePem,
        referenceXPath: "//*[local-name()='SummaryDocuments']",
      });

      const zipBuffer = await zipXml({ fileName: fileNameBase, xml: xmlSigned });
      const result = await sunatSendSummary({ fileName: `${fileNameBase}.zip`, zipBuffer, config });

      res.json({
        ok: true,
        fileName: fileNameBase,
        xmlSignedBase64: Buffer.from(xmlSigned, 'utf8').toString('base64'),
        ticket: result.ticket,
        raw: result.raw,
      });
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  // ===== GENERACIÓN DE PDF =====
  generateInvoicePdfHandler: async (req, res) => {
    try {
      const payload = req.body;
      const hash = payload?.hash || '';

      const pdfBuffer = await generateInvoicePdf(payload, hash);

      const tipoDoc = payload?.tipoDoc || '03';
      const serie = payload?.serie || 'B001';
      const correlativo = String(payload?.correlativo || '1').padStart(8, '0');
      const fileName = `${serie}-${correlativo}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },

  generateDespatchPdfHandler: async (req, res) => {
    try {
      const payload = req.body;
      const hash = payload?.hash || '';

      const pdfBuffer = await generateDespatchPdf(payload, hash);

      const serie = payload?.serie || 'T001';
      const correlativo = String(payload?.correlativo || '1').padStart(8, '0');
      const fileName = `${serie}-${correlativo}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (e) {
      res.status(500).json({ ok: false, message: e.message });
    }
  },
};
