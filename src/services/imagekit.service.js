import ImageKit from 'imagekit';

// Inicializar ImageKit con credenciales de entorno
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || ''
});

/**
 * Subir imagen a ImageKit
 * @param {Object} options - Opciones de subida
 * @param {string} options.file - Base64 string o URL de la imagen
 * @param {string} options.fileName - Nombre del archivo
 * @param {string} options.folder - Carpeta destino (ej: "/logos/")
 * @returns {Promise<Object>} Resultado con url, fileId, etc.
 */
export async function uploadImage({ file, fileName, folder = '/uploads/' }) {
    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
        throw new Error('ImageKit no está configurado. Revisa las variables IMAGEKIT_* en .env');
    }

    try {
        const result = await imagekit.upload({
            file, // Base64 o URL
            fileName,
            folder,
            useUniqueFileName: true,
            tags: ['erp', 'logo']
        });

        return {
            success: true,
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            fileId: result.fileId,
            name: result.name,
            filePath: result.filePath
        };
    } catch (error) {
        console.error('Error subiendo imagen a ImageKit:', error);
        throw new Error(error.message || 'Error al subir imagen');
    }
}

/**
 * Eliminar imagen de ImageKit
 * @param {string} fileId - ID del archivo a eliminar
 */
export async function deleteImage(fileId) {
    if (!fileId) return { success: false, message: 'fileId requerido' };

    try {
        await imagekit.deleteFile(fileId);
        return { success: true };
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Obtener URL optimizada con transformaciones
 * @param {string} path - Ruta del archivo en ImageKit
 * @param {Object} transformations - Transformaciones (width, height, quality, etc.)
 */
export function getOptimizedUrl(path, transformations = {}) {
    return imagekit.url({
        path,
        transformation: [
            {
                width: transformations.width || 200,
                height: transformations.height || 200,
                quality: transformations.quality || 80,
                format: 'webp'
            }
        ]
    });
}

/**
 * Generar token de autenticación para subida desde frontend (si se necesita)
 */
export function getAuthenticationParameters() {
    return imagekit.getAuthenticationParameters();
}

export default {
    uploadImage,
    deleteImage,
    getOptimizedUrl,
    getAuthenticationParameters
};
