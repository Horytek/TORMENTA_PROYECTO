import { set, get, del } from 'idb-keyval';

const TOKEN_KEY = 'auth_token';

/**
 * Guarda el token de forma asíncrona en IndexedDB
 * @param {string} token 
 */
export const setToken = async (token) => {
    if (!token) return;
    await set(TOKEN_KEY, token);
};

/**
 * Recupera el token de forma asíncrona desde IndexedDB
 * @returns {Promise<string|undefined>}
 */
export const getToken = async () => {
    return await get(TOKEN_KEY);
};

/**
 * Elimina el token de IndexedDB
 */
export const removeToken = async () => {
    await del(TOKEN_KEY);
};
