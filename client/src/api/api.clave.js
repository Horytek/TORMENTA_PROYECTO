import axios from "./axios";

export const getClavesRequest = async () =>
  await axios.get("/clave");

export const getClaveRequest = async (id) =>
  await axios.get(`/clave/${id}`);

export const getClaveByEmpresaAndTipoRequest = async (id) =>
  await axios.get(`/clave/valor/${id}`);

export const addClaveRequest = async (producto) =>
  await axios.post("/clave", producto);

export const updateClaveRequest = async (id, newFields) =>
  await axios.put(`/clave/${id}`, newFields);

export const deleteClaveRequest = async (id) =>
  await axios.delete(`/clave/${id}`);