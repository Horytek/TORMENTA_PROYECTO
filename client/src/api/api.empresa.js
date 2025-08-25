import axios from "./axios";

export const getEmpresasRequest = async () =>
  await axios.get("/empresa");

export const getEmpresaRequest = async (id) =>
  await axios.get(`/empresa/${id}`);

export const addEmpresaRequest = async (producto) =>
  await axios.post("/empresa", producto);

export const updateEmpresaRequest = async (id, newFields) =>
  await axios.put(`/empresa/${id}`, newFields); 

export const deleteEmpresaRequest = async (id) =>
  await axios.delete(`/empresa/${id}`);

export const updateEmpresaMonedasRequest = async (id, monedas, pais) =>
  await axios.put(`/empresa/${id}/monedas`, { monedas, pais });