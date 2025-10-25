import { Router } from 'express';
import multer from 'multer';
import { sendResendEmail } from '../controllers/email.controller.js';

const upload = multer();
const router = Router();

router.post('/send-resend', upload.fields([
  { name: 'certificado', maxCount: 1 },
  { name: 'logo', maxCount: 1 }
]), sendResendEmail);

export default router;