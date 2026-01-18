import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { methods as sunatController } from '../controllers/sunat.controller.js';

const router = Router();

// Mantener protegido: maneja emisión y credenciales por env
router.use(auth);

router.get('/config', sunatController.getConfig);

// CPE (Factura/Boleta)
router.post('/cpe/send-bill', sunatController.sendBill);
router.post('/cpe/send-summary', sunatController.sendSummary);
router.post('/cpe/send-pack', sunatController.sendPack);
router.get('/cpe/status/:ticket', sunatController.getStatus);

// Flujo A: construir UBL + firmar + enviar
router.post('/cpe/invoice/build-sign', sunatController.buildAndSignInvoice);
router.post('/cpe/invoice/emit', sunatController.buildAndSendInvoice);

// GRE (Guía de Remisión Electrónica)
router.post('/gre/despatch/build-sign', sunatController.buildAndSignGre);
router.post('/gre/despatch/emit', sunatController.emitGre);
router.post('/gre/despatch/pdf', sunatController.generateDespatchPdfHandler);

// Comunicación de Baja (anular Facturas)
router.post('/cpe/voided/emit', sunatController.buildAndSendVoided);

// Resumen Diario (anular Boletas)
router.post('/cpe/summary/emit', sunatController.buildAndSendSummary);

// Generación de PDF
router.post('/cpe/invoice/pdf', sunatController.generateInvoicePdfHandler);

export default router;

