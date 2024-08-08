import axios from "./axios";

export const getProductosRequest = async () =>
  await axios.get("/productos");

export const getLastIdProductoRequest = async () =>
  await axios.get("/productos/lastid");

export const getProductoRequest = async (id) =>
  await axios.get(`/productos/${id}`);

export const addProductosRequest = async (producto) =>
  await axios.post("/productos", producto);

export const updateProductoRequest = async (id, newFields) =>
  await axios.put(`/productos/${id}`, newFields); 

export const deleteProductosRequest = async (id) =>
  await axios.delete(`/productos/${id}`);