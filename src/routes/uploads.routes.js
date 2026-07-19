import { Router } from 'express';
import { methods as uploadsController } from '../controllers/uploads.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import { requireCapability } from '../middlewares/authorize.middleware.js';

const router = Router();

// Subir imagen genérica (la usan las imágenes de productos — api.uploads)
router.post('/image', auth, requireCapability('productos', 'editar'), uploadsController.uploadImage);

// Subir logotipo de empresa (Configuración del negocio / Cuenta)
router.post('/logo', auth, requireCapability('configuracion/negocio', 'editar'), uploadsController.uploadLogo);

// Eliminar imagen
router.delete('/image/:fileId', auth, requireCapability('productos', 'editar'), uploadsController.deleteImage);

// Obtener parámetros de autenticación (para subida desde frontend si se necesita)
router.get('/auth', auth, uploadsController.getAuthParams);

export default router;
