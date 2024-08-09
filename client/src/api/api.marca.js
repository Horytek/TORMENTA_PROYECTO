import axios from "./axios";

export const getMarcasRequest = async () =>
  await axios.get("/marcas");

export const getMarcaRequest = async (id) =>
  await axios.get(`/marcas/${id}`);


export const addMarcasRequest = async (marca) =>
  await axios.post("/marcas", marca);

export const deleteMarcaRequest = async (id) =>
  await axios.delete(`/marcas/${id}`);

export const updateMarcaRequest = async (id, marca) =>
  await axios.put(`/marcas/update/${id}`, marca);

export const deactivateMarcaRequest = async (id) =>
  await axios.put(`/marcas/deactivate/${id}`);