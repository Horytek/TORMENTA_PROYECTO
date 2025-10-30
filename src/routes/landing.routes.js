import { Router } from 'express';
import { sendLandingContact } from '../controllers/landing.controller.js';

const router = Router();

/**
 * Ruta para recibir consultas desde la landing page
 * POST /api/landing/contact
 */
router.post('/contact', sendLandingContact);

export default router;
