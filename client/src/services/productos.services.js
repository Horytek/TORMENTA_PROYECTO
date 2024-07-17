import { getProductosRequest,
  getProductoRequest,
  addProductosRequest,
  updateProductoRequest,
  deleteProductosRequest } from "../api/api.productos";
import { handleApiResponse } from "../utils/api.utils";

export const getProductos = () => handleApiResponse(getProductosRequest);

export const getProducto = (id) =>
  handleApiResponse(() => getProductoRequest(id));

export const addProducto = (producto) =>
  handleApiResponse(() => addProductosRequest(producto));

export const updateProducto = (id, newFields) =>
  handleApiResponse(() => updateProductoRequest(id, newFields));

export const deleteProducto = (id) =>
  handleApiResponse(() => deleteProductosRequest(id));
