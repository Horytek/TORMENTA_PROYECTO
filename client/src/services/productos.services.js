import { 
  getProductosRequest,
  getProductoRequest,
  addProductosRequest,
  updateProductoRequest,
  deleteProductosRequest } from "../api/api.productos";
import { handleApiResponse } from "../utils/api.utils";

export async function getProductos() {
  const productos = await handleApiResponse(getProductosRequest);

  // Transformar los datos
  const productosTransformados = productos.map(producto => ({
    ...producto,
    precio: parseFloat(producto.precio), // Convertir precio a número
    descripcion: producto.descripcion.toUpperCase(), // Convertir descripción a mayúsculas
    nom_subcat: producto.nom_subcat.toUpperCase(), // Convertir nombre de subcategoría a mayúsculas
    nom_marca: producto.nom_marca.toUpperCase(), // Convertir nombre de marca a mayúsculas
    cod_barras: producto.cod_barras || '-',
    undm: producto.undm.toUpperCase(),
    estado: parseInt(producto.estado) === 0 ? 'Inactivo' : 'Activo'
  }));

  return productosTransformados;
}

export async function getProducto(id) {
  return handleApiResponse(getProductoRequest(id));
}

export async function addProducto(producto) {
  return handleApiResponse(addProductosRequest(producto));
}

export async function updateProducto(id, newFields) {
  return handleApiResponse(updateProductoRequest(id, newFields));
}

export async function deleteProducto(id) {
  return handleApiResponse(deleteProductosRequest(id));
}