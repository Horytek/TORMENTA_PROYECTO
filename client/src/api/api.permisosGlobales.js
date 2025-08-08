import axios from "./axios";

// Obtener módulos con submódulos por plan
export const getModulosConSubmodulosPorPlanRequest = () =>
  axios.get("/permisos-globales/modulos-plan");

// Obtener roles por plan
export const getRolesPorPlanRequest = () =>
  axios.get("/permisos-globales/roles-plan");

// Obtener permisos por rol global
export const getPermisosByRolGlobalRequest = (id_rol, plan) =>
  axios.get(`/permisos-globales/permisos-rol/${id_rol}`, {
    params: plan ? { plan } : {}
  });

// Chequear permiso global (requiere token)
export const checkPermisoGlobalRequest = (params) =>
  axios.get("/permisos-globales/check-global", { params });

// Obtener planes disponibles
export const getPlanesDisponiblesRequest = () =>
  axios.get("/permisos-globales/planes");

// Guardar permisos globales
export const savePermisosGlobalesRequest = (permisos) =>
  axios.post("/permisos-globales/save-global", permisos);
