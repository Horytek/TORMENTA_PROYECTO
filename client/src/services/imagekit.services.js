import { uploadLogoRequest, uploadImageRequest, deleteImageRequest } from '@/api/api.uploads';

/**
 * Subir logotipo de empresa a ImageKit
 * @param {string} base64File - Imagen en formato Base64
 * @param {number} empresaId - ID de la empresa
 * @returns {Promise<Object>} { success, url, fileId, ... }
 */
export async function uploadLogo(base64File, empresaId) {
    try {
        const response = await uploadLogoRequest(base64File, empresaId);
        return response.data;
    } catch (error) {
        console.error('Error en uploadLogo:', error);
        throw error;
    }
}

/**
 * Subir imagen genérica a ImageKit
 * @param {string} base64File - Imagen en formato Base64
 * @param {string} fileName - Nombre del archivo
 * @param {string} folder - Carpeta destino (opcional)
 * @returns {Promise<Object>}
 */
export async function uploadImage(base64File, fileName, folder = '/uploads/') {
    try {
        const response = await uploadImageRequest(base64File, fileName, folder);
        return response.data;
    } catch (error) {
        console.error('Error en uploadImage:', error);
        throw error;
    }
}

/**
 * Eliminar imagen de ImageKit
 * @param {string} fileId - ID del archivo en ImageKit
 * @returns {Promise<Object>}
 */
export async function deleteImage(fileId) {
    try {
        const response = await deleteImageRequest(fileId);
        return response.data;
    } catch (error) {
        console.error('Error en deleteImage:', error);
        throw error;
    }
}

export default {
    uploadLogo,
    uploadImage,
    deleteImage
};
