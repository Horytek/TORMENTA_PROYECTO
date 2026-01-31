import { getNotificacionesRequest } from "@/api/api.dashboard";

/**
 * Obtiene las notificaciones recientes del sistema.
 * @returns {Promise<Array>} Lista de notificaciones [{ id, mensaje, fecha }]
 */
export const getNotificaciones = async (limit = 20, offset = 0) => {
  try {
    const response = await getNotificacionesRequest({ limit, offset });
    if (response.data && response.data.code === 1) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error("Error al obtener notificaciones:", error.message);
    return [];
  }
};