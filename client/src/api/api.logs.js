import fetchJSON from './axios';

/**
 * Obtiene los logs del sistema desde la API.
 * @param {number} page - Número de página.
 * @param {number} limit - Límite de registros por página.
 * @returns {Promise<Object>} - Datos de los logs y el total.
 */
export const getSystemLogs = async (page = 1, limit = 25) => {
  const params = new URLSearchParams({ page, limit });
  const url = `/logs?${params.toString()}`;
  return fetchJSON(url);
};
