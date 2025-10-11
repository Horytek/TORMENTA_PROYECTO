import bcrypt from 'bcryptjs';

/**
 * Utilidad para hashear y verificar contraseñas de forma segura con bcrypt
 */

// Configuración de seguridad
const SALT_ROUNDS = 12; // Mayor número = más seguro pero más lento (10-12 recomendado)

/**
 * Hashear una contraseña de forma segura
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} - Hash de la contraseña
 */
export async function hashPassword(password) {
    if (!password || typeof password !== 'string') {
        throw new Error('La contraseña debe ser un string válido');
    }
    
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verificar si una contraseña coincide con su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado en la BD
 * @returns {Promise<boolean>} - true si coincide, false si no
 */
export async function verifyPassword(password, hash) {
    if (!password || !hash) {
        return false;
    }
    
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        console.error('Error al verificar contraseña:', error);
        return false;
    }
}

/**
 * Verificar si un string es un hash de bcrypt válido
 * @param {string} str - String a verificar
 * @returns {boolean} - true si es un hash de bcrypt
 */
export function isBcryptHash(str) {
    // Los hashes de bcrypt empiezan con $2a$, $2b$, o $2y$
    return /^\$2[aby]\$\d{2}\$.{53}$/.test(str);
}

