import axios from "./axios";

export const getSubcategoriasRequest = async () =>
  await axios.get("/subcategorias");

export const getSubcategoriasForCategoriasRequest = async (id) =>
    await axios.get(`/categoria/${id}`);

export const getSubcategoriaNomCategoriaRequest = async () =>
  await axios.get("/subcategorias");

export const addSubcategoriaRequest = async (subcategoria) =>
  await axios.post("/subcategorias", subcategoria);

export const updateSubcategoriaRequest = async (subcategoria) =>
  await axios.put(`/subcategorias/update/${subcategoria.id}`, subcategoria);

export const deleteSubcategoriaRequest = async (id) =>
  await axios.delete(`/subcategorias/${id}`);

export const deactivateSubcategoriaRequest = async (id) =>
  await axios.put(`/subcategorias/deactivate/${id}`);