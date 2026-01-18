import { uploadImage, deleteImage, getAuthenticationParameters } from '../services/imagekit.service.js';

export const methods = {
    /**
     * Subir imagen a ImageKit
     * POST /api/uploads/image
     * Body: { file: base64String, fileName: string, folder?: string }
     */
    uploadImage: async (req, res) => {
        try {
            const { file, fileName, folder } = req.body;

            if (!file || !fileName) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere file (base64) y fileName'
                });
            }

            // Validar que sea una imagen
            const validTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
            const extension = fileName.split('.').pop()?.toLowerCase();
            if (extension && !validTypes.includes(extension)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de archivo no permitido. Usa: ' + validTypes.join(', ')
                });
            }

            const result = await uploadImage({
                file,
                fileName,
                folder: folder || '/logos/'
            });

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error al subir imagen'
            });
        }
    },

    /**
     * Subir logotipo de empresa
     * POST /api/uploads/logo
     * Body: { file: base64String, empresaId: number }
     */
    uploadLogo: async (req, res) => {
        try {
            const { file, empresaId } = req.body;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere file (base64)'
                });
            }

            // Determinar extensión del base64
            let extension = 'png';
            if (file.startsWith('/9j/')) extension = 'jpg';
            else if (file.startsWith('iVBORw0KGgo')) extension = 'png';
            else if (file.startsWith('R0lGOD')) extension = 'gif';

            const fileName = `logo_${empresaId || Date.now()}.${extension}`;

            const result = await uploadImage({
                file,
                fileName,
                folder: '/logos/'
            });

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error al subir logotipo'
            });
        }
    },

    /**
     * Eliminar imagen
     * DELETE /api/uploads/image/:fileId
     */
    deleteImage: async (req, res) => {
        try {
            const { fileId } = req.params;

            if (!fileId) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere fileId'
                });
            }

            const result = await deleteImage(fileId);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error al eliminar imagen'
            });
        }
    },

    /**
     * Obtener parámetros de autenticación para subida desde frontend
     * GET /api/uploads/auth
     */
    getAuthParams: async (_req, res) => {
        try {
            const authParams = getAuthenticationParameters();
            res.json({
                success: true,
                ...authParams
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};
