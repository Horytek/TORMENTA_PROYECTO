import axios from "axios";

export const getSubcategoriasRequest = async () =>
  await axios.get("http://localhost:4000/api/subcategorias");

export const getSubcategoriasForCategoriasRequest = async (id) =>
    await axios.get(`http://localhost:4000/api/subcategorias/categoria/${id}`);