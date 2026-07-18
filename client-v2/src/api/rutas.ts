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

/** Metadata dinámica de sidebar (columnas nuevas en `modulo`/`submodulos`, ver migration_006). */
export interface CatalogMeta {
  icon?: string | null;
  group_name?: string | null;
  sort_order?: number;
  frontend_route?: string | null;
  is_visible?: boolean;
}

export interface RouteModule extends CatalogMeta {
  id: number;
  nombre: string;
  ruta: string;
  active_actions?: string | string[];
  expandible: boolean;
  submodulos: ({
    id_submodulo: number;
    id_modulo: number;
    nombre_sub: string;
    ruta: string;
    active_actions?: string | string[];
  } & CatalogMeta)[];
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
        icon: mod.icon ?? null,
        group_name: mod.group_name ?? null,
        sort_order: mod.sort_order ?? 0,
        frontend_route: mod.frontend_route ?? null,
        is_visible: mod.is_visible ?? true,
        submodulos: Array.isArray(mod.submodulos) ? mod.submodulos.map((sub: any) => ({
          id_submodulo: Number(sub.id_submodulo),
          id_modulo: Number(sub.id_modulo),
          nombre_sub: String(sub.nombre_sub || ''),
          ruta: String(sub.ruta || ''),
          active_actions: sub.active_actions,
          icon: sub.icon ?? null,
          group_name: sub.group_name ?? null,
          sort_order: sub.sort_order ?? 0,
          frontend_route: sub.frontend_route ?? null,
          is_visible: sub.is_visible ?? true,
        })) : []
      }));
    }
    return [];
  } catch (error: any) {
    console.error("Error en getModulosConSubmodulos:", error);
    return [];
  }
};
