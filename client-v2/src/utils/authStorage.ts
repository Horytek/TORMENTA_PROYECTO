import { set, get, del } from 'idb-keyval';

const TOKEN_KEY = 'auth_token';

/**
 * Guarda el token de forma asíncrona en IndexedDB
 */
export const setToken = async (token: string): Promise<void> => {
  if (!token) return;
  await set(TOKEN_KEY, token);
};

/**
 * Recupera el token de forma asíncrona desde IndexedDB
 */
export const getToken = async (): Promise<string | undefined> => {
  return await get<string>(TOKEN_KEY);
};

/**
 * Elimina el token de IndexedDB
 */
export const removeToken = async (): Promise<void> => {
  await del(TOKEN_KEY);
};
