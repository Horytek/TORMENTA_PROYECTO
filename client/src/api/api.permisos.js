import axios from "./axios";

// Obtener módulos con submódulos
export const getModulosConSubmodulosRequest = () =>
  axios.get("/permisos");

// Obtener roles
export const getRolesRequest = () =>
  axios.get("/permisos/roles");

// Obtener permisos por rol
export const getPermisosByRolRequest = (id_rol) =>
  axios.get(`/permisos/roles/${id_rol}`);

// Chequear permiso (requiere token)
export const checkPermisoRequest = (params) =>
  axios.get("/permisos/check", { params });

// Obtener permisos de un módulo por rol (requiere token)
export const getPermisosModuloRequest = (id_rol) =>
  axios.get(`/permisos/permisos/${id_rol}`);

// Guardar permisos
export const savePermisosRequest = (permisos) =>
  axios.post("/permisos/save", permisos);