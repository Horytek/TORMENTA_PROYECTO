import ImageKit from "imagekit";

let imagekitClient = null;

function getImageKitClient() {
    if (!imagekitClient) {
        const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || 'public_FwaHDpc2jTrEc20uJ9cnKoypqJ0=';
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 'private_a2P9Cijfwkx/u51BhiUvWMIbFTk=';
        const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT && !process.env.IMAGEKIT_URL_ENDPOINT.includes('tu_imagekit_id')
            ? process.env.IMAGEKIT_URL_ENDPOINT
            : 'https://ik.imagekit.io/tormenta';

        imagekitClient = new ImageKit({
            publicKey,
            privateKey,
            urlEndpoint
        });
    }
    return imagekitClient;
}

/**
 * Subir imagen a ImageKit
 * @param {Object} options - Opciones de subida
 * @param {string} options.file - Base64 string o URL de la imagen
 * @param {string} options.fileName - Nombre del archivo
 * @param {string} options.folder - Carpeta destino (ej: "/logos/")
 * @returns {Promise<Object>} Resultado con url, fileId, etc.
 */
export async function uploadImage({ file, fileName, folder = '/uploads/' }) {
    try {
        const client = getImageKitClient();
        const result = await client.upload({
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
        await getImageKitClient().deleteFile(fileId);
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
    return getImageKitClient().url({
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
    return getImageKitClient().getAuthenticationParameters();
}

export default {
    uploadImage,
    deleteImage,
    getOptimizedUrl,
    getAuthenticationParameters
};
