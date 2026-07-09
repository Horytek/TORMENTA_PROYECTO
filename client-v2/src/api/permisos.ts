import axios from "./axios";

export const getModulosConSubmodulosRequest = () =>
  axios.get("/permisos");

export const getRolesRequest = () =>
  axios.get("/permisos/roles");

export const getPermisosByRolRequest = (id_rol: number | string) =>
  axios.get(`/permisos/roles/${id_rol}`);

export const checkPermisoRequest = (params: any) =>
  axios.get("/permisos/check", { params });

export const getPermisosModuloRequest = (id_rol: number | string) =>
  axios.get(`/permisos/permisos/${id_rol}`);

export const savePermisosRequest = (permisos: any) =>
  axios.post("/permisos/save", permisos);
