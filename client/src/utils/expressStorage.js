import { set, get, del } from 'idb-keyval';

const TOKEN_KEY = 'express_token';
const BUSINESS_KEY = 'express_business_name';

/**
 * Guarda el token de Express de forma asíncrona
 * @param {string} token 
 */
export const setExpressToken = async (token) => {
    if (!token) return;
    await set(TOKEN_KEY, token);
};

/**
 * Obtiene el token de Express
 * @returns {Promise<string>}
 */
export const getExpressToken = async () => {
    return await get(TOKEN_KEY);
};

/**
 * Elimina el token de Express
 */
export const removeExpressToken = async () => {
    await del(TOKEN_KEY);
};

/**
 * Guarda el nombre del negocio
 * @param {string} name 
 */
export const setBusinessName = async (name) => {
    if (!name) return;
    await set(BUSINESS_KEY, name);
};

/**
 * Obtiene el nombre del negocio
 * @returns {Promise<string>}
 */
export const getBusinessName = async () => {
    return await get(BUSINESS_KEY);
};

/**
 * Elimina el nombre del negocio
 */
export const removeBusinessName = async () => {
    await del(BUSINESS_KEY);
};
