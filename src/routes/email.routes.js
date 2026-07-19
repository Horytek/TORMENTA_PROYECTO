import { Router } from 'express';
import multer from 'multer';
import { sendResendEmail } from '../controllers/email.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/authorize.middleware.js';

const upload = multer();
const router = Router();

// Envío de certificado/logo por email — flujo de cuenta/onboarding del
// Administrador (v1 resend.services); ningún flujo operativo lo usa.
router.post('/send-resend', auth, requireAdmin, upload.fields([
  { name: 'certificado', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
]), sendResendEmail);

export default router;