import axios from "./axios";

export const getProductosRequest = async () =>
  await axios.get("/productos");

export const getLastIdProductoRequest = async () =>
  await axios.get("/productos/lastid");

export const getProductoRequest = async (id) =>
  await axios.get(`/productos/${id}`);

export const getProductVariantsRequest = async (id, params) =>
  await axios.get(`/productos/${id}/variants`, { params });

export const getProductAttributesRequest = async (id) =>
  await axios.get(`/productos/${id}/attributes`);

// NEW: Generic SKU Generation
export const generateSKUsRequest = async (data) =>
  await axios.post("/productos/skus/generate", data);

export const registerProductVariantsRequest = async (data) =>
  await axios.post("/productos/variants", data);

export const addProductosRequest = async (producto) =>
  await axios.post("/productos", producto);

export const updateProductoRequest = async (id, newFields) =>
  await axios.put(`/productos/${id}`, newFields);

export const deleteProductosRequest = async (id) =>
  await axios.delete(`/productos/${id}`);

export const importExcelRequest = async (data) =>
  await axios.post("/productos/import/excel", { data });