import axios from "axios";

export const getProductosRequest = async () =>
  await axios.get("http://localhost:4000/api/productos");

export const getLastIdProductoRequest = async () =>
  await axios.get("http://localhost:4000/api/productos/lastid");

export const getProductoRequest = async (id) =>
    await axios.get(`http://localhost:4000/api/productos/${id}`);

export const addProductosRequest = async (producto) =>
  await axios.post("http://localhost:4000/api/productos", producto);

export const updateProductoRequest = async (id, newFields) =>
  await axios.put(`http://localhost:4000/api/productos/${id}`, newFields); 

export const deleteProductosRequest = async (id) =>
  await axios.delete(`http://localhost:4000/api/productos/${id}`);