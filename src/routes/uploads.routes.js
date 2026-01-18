import { Router } from 'express';
import { methods as uploadsController } from '../controllers/uploads.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

// Subir imagen genérica
router.post('/image', auth, uploadsController.uploadImage);

// Subir logotipo de empresa
router.post('/logo', auth, uploadsController.uploadLogo);

// Eliminar imagen
router.delete('/image/:fileId', auth, uploadsController.deleteImage);

// Obtener parámetros de autenticación (para subida desde frontend si se necesita)
router.get('/auth', auth, uploadsController.getAuthParams);

export default router;
