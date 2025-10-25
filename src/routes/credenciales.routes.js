import { Router } from 'express';
import { sendCredencialesEmail } from '../controllers/credenciales.controller.js';

const router = Router();

router.post('/send-credenciales', sendCredencialesEmail);

export default router;