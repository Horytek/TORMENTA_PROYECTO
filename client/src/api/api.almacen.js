import axios from "./axios";

export const getAlmacenesRequest = async () =>
  await axios.get("/almacen");

export const getSucursalesRequest = async () =>
  await axios.get("/almacen/sucursales");

export const getAlmacenRequest = async (id) =>
  await axios.get(`/almacen/${id}`);

export const addAlmacenRequest = async (almacen) =>
  await axios.post("/almacen", almacen);

export const updateAlmacenRequest = async (id, newFields) =>
  await axios.put(`/almacen/${id}`, newFields); 

export const deleteAlmacenRequest = async (id) =>
  await axios.delete(`/almacen/${id}`);

export const getAlmacenesRequest_A = async () =>
  await axios.get("/almacen/alternativo");
