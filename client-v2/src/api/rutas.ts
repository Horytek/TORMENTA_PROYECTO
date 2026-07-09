import axios from "./axios";

export const getModulosRequest = async () => {
  return await axios.get("/rutas");
};

export const getSubmodulosRequest = async () => {
  return await axios.get("/rutas/submodulos");
};

export const getModulosConSubmodulosRequest = async () => {
  return await axios.get("/rutas/modulos");
};

export interface RouteModule {
  id: number;
  nombre: string;
  ruta: string;
  active_actions?: string | string[];
  expandible: boolean;
  submodulos: {
    id_submodulo: number;
    id_modulo: number;
    nombre_sub: string;
    ruta: string;
    active_actions?: string | string[];
  }[];
}

export const getModulosConSubmodulos = async (): Promise<RouteModule[]> => {
  try {
    const response = await getModulosConSubmodulosRequest();
    const responseData = response.data?.data || response.data || [];

    if (Array.isArray(responseData)) {
      return responseData.map((mod: any) => ({
        id: Number(mod.id),
        nombre: String(mod.nombre || ''),
        ruta: String(mod.ruta || ''),
        active_actions: mod.active_actions,
        expandible: Boolean(mod.expandible),
        submodulos: Array.isArray(mod.submodulos) ? mod.submodulos.map((sub: any) => ({
          id_submodulo: Number(sub.id_submodulo),
          id_modulo: Number(sub.id_modulo),
          nombre_sub: String(sub.nombre_sub || ''),
          ruta: String(sub.ruta || ''),
          active_actions: sub.active_actions
        })) : []
      }));
    }
    return [];
  } catch (error: any) {
    console.error("Error en getModulosConSubmodulos:", error);
    return [];
  }
};
