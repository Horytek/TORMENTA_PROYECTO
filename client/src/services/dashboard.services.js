import { getNotificacionesRequest } from "@/api/api.dashboard";

/**
 * Obtiene las notificaciones recientes del sistema.
 * @returns {Promise<Array>} Lista de notificaciones [{ id, mensaje, fecha }]
 */
export const getNotificaciones = async () => {
  try {
    const response = await getNotificacionesRequest();
    if (response.data && response.data.code === 1) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error("Error al obtener notificaciones:", error.message);
    return [];
  }
};