import axios from "./axios";

export const getCategoriasRequest = async () => 
  await axios.get("/categorias");

export const getCategoriaRequest = async (id) =>
  await axios.get(`/categorias/${id}`);

export const addCategoriaRequest = async (categoria) => 
  await axios.post("/categorias", categoria);

export const deleteCategoriaRequest = async (id) => 
  await axios.delete(`/categorias/${id}`);

export const deactivateCategoriaRequest = async (id) => 
  await axios.put(`/categorias/deactivate/${id}`);

export const updateCategoriaRequest = async (id, categoria) => 
  await axios.put(`/categorias/update/${id}`, categoria);
