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

const EMAIL_KEY = 'express_email';

export const setExpressEmail = async (email) => {
    if (!email) return;
    await set(EMAIL_KEY, email);
};

export const getExpressEmail = async () => {
    return await get(EMAIL_KEY);
};

export const removeExpressEmail = async () => {
    await del(EMAIL_KEY);
};

const ROLE_KEY = 'express_role';

export const setExpressRole = async (role) => {
    if (!role) return;
    await set(ROLE_KEY, role);
};

export const getExpressRole = async () => {
    return await get(ROLE_KEY);
};

export const removeExpressRole = async () => {
    await del(ROLE_KEY);
};

const PERMISSIONS_KEY = 'express_permissions';

export const setExpressPermissions = async (permissions) => {
    if (!permissions) return;
    // Permissions is likely a JSON string or object. Let's store as object.
    const val = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
    await set(PERMISSIONS_KEY, val);
};

export const getExpressPermissions = async () => {
    return await get(PERMISSIONS_KEY);
};

export const removeExpressPermissions = async () => {
    await del(PERMISSIONS_KEY);
};
