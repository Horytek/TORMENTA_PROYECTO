import axios from "./axios";

export const getSubcategoriasRequest = async () =>
  await axios.get("/subcategorias");

export const getSubcategoriasForCategoriasRequest = async (id) =>
    await axios.get(`/categoria/${id}`);

export const addSubcategoriaRequest = async (subcategoria) =>
  await axios.post("/subcategorias", subcategoria);