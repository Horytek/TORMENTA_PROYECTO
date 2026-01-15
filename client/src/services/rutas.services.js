import { getModulosRequest, getSubmodulosRequest, getModulosConSubmodulosRequest } from '@/api/api.rutas';
export const getModulos = async () => {
  try {
    const response = await getModulosRequest();
    return response.data;
  } catch (error) {
    console.error("Error en getModulos:", error.message);
    return [];
  }
};

export const getSubmodulos = async () => {
  try {
    const response = await getSubmodulosRequest();
    return response.data;
  } catch (error) {
    console.error("Error en getSubmodulos:", error.message);
    return [];
  }
};

export const getModulosConSubmodulos = async () => {
  try {
    const response = await getModulosConSubmodulosRequest();

    const responseData = response.data?.data || response.data || [];

    if (Array.isArray(responseData)) {
      const datosNormalizados = responseData.map(mod => ({
        id: Number(mod.id),
        nombre: String(mod.nombre || ''),
        ruta: String(mod.ruta || ''),
        active_actions: mod.active_actions,
        expandible: Boolean(mod.expandible),
        submodulos: Array.isArray(mod.submodulos) ? mod.submodulos.map(sub => ({
          id_submodulo: Number(sub.id_submodulo),
          id_modulo: Number(sub.id_modulo),
          nombre_sub: String(sub.nombre_sub || ''),
          ruta: String(sub.ruta || ''),
          active_actions: sub.active_actions
        })) : []
      }));

      return datosNormalizados;
    }

    return [];
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};