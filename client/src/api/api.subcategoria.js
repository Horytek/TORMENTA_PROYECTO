import axios from "./axios";

// Obtener todas las subcategorías
export const getSubcategoriasRequest = async () =>
  await axios.get("/subcategorias");

// Obtener subcategorías por categoría
export const getSubcategoriasForCategoriasRequest = async (id) =>
  await axios.get(`/categoria/${id}`);

// Obtener subcategorías con nombre de categoría
export const getSubcategoriaNomCategoriaRequest = async () =>
  await axios.get("/subcategorias");

// Agregar subcategoría
export const addSubcategoriaRequest = async (subcategoria) =>
  await axios.post("/subcategorias", subcategoria);

// Actualizar subcategoría
export const updateSubcategoriaRequest = async (id, subcategoria) =>
  await axios.put(`/subcategorias/update/${id}`, subcategoria);

// Eliminar subcategoría
export const deleteSubcategoriaRequest = async (id) =>
  await axios.delete(`/subcategorias/${id}`);

// Desactivar subcategoría
export const deactivateSubcategoriaRequest = async (id) =>
  await axios.put(`/subcategorias/deactivate/${id}`);

// Obtener una subcategoría por ID
export const getSubcategoriaRequest = async (id) =>
  await axios.get(`/subcategorias/${id}`);

// Obtener subcategorías con datos de categoría (lista extendida)
export const getSubcategoriasConCategoriaRequest = async () =>
  await axios.get("/subcategorias/subcategoria_list");

export const importExcelRequest = async (data) =>
  await axios.post("/subcategorias/import/excel", { data });