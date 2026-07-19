import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { requireCapability } from '../middlewares/authorize.middleware.js';
import { methods as sunatController } from '../controllers/sunat.controller.js';

const router = Router();

// Mantener protegido: maneja emisión y credenciales por env
router.use(auth);

// Autorización (Fase 0 de PLAN_PERMISOS_PLAN_ROLES.md): solo se AGREGA
// requireCapability, sin tocar la lógica de emisión (Regla de Oro Nº3).
// CPE (facturas/boletas) es parte del flujo de venta → capacidad "ventas";
// GRE va con "guia_remision". Emitir/anular = "generar"; PDFs/consultas = "ver".
const puedeVerVentas = requireCapability("ventas", "ver");
const puedeEmitirVentas = requireCapability("ventas", "generar");
const puedeVerGuias = requireCapability("guia_remision", "ver");
const puedeEmitirGuias = requireCapability("guia_remision", "generar");

router.get('/config', sunatController.getConfig);

// CPE (Factura/Boleta)
router.post('/cpe/send-bill', puedeEmitirVentas, sunatController.sendBill);
router.post('/cpe/send-summary', puedeEmitirVentas, sunatController.sendSummary);
router.post('/cpe/send-pack', puedeEmitirVentas, sunatController.sendPack);
router.get('/cpe/status/:ticket', sunatController.getStatus);

// Flujo A: construir UBL + firmar + enviar
router.post('/cpe/invoice/build-sign', puedeEmitirVentas, sunatController.buildAndSignInvoice);
router.post('/cpe/invoice/emit', puedeEmitirVentas, sunatController.buildAndSendInvoice);

// GRE (Guía de Remisión Electrónica)
router.post('/gre/despatch/build-sign', puedeEmitirGuias, sunatController.buildAndSignGre);
router.post('/gre/despatch/emit', puedeEmitirGuias, sunatController.emitGre);
router.post('/gre/despatch/pdf', puedeVerGuias, sunatController.generateDespatchPdfHandler);

// Comunicación de Baja (anular Facturas)
router.post('/cpe/voided/emit', puedeEmitirVentas, sunatController.buildAndSendVoided);

// Resumen Diario (anular Boletas)
router.post('/cpe/summary/emit', puedeEmitirVentas, sunatController.buildAndSendSummary);

// Generación de PDF
router.post('/cpe/invoice/pdf', puedeVerVentas, sunatController.generateInvoicePdfHandler);

export default router;
