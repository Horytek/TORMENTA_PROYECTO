import axios from "axios";

const BASE_URL = "http://localhost:4000/api/categorias";

export const getCategoriasRequest = async () => 
  await axios.get(BASE_URL);

export const getCategoriaRequest = async (id) =>
  await axios.get(`${BASE_URL}/${id}`);

export const addCategoriaRequest = async (categoria) => 
  await axios.post(BASE_URL, categoria);

export const deleteCategoriaRequest = async (id) => 
  await axios.delete(`${BASE_URL}/${id}`);

export const deactivateCategoriaRequest = async (id) => 
  await axios.put(`${BASE_URL}/deactivate/${id}`);

export const updateCategoriaRequest = async (id, categoria) => 
  await axios.put(`${BASE_URL}/update/${id}`, categoria);
