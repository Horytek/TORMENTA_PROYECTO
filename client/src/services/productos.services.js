import { getProductosRequest,
  /* getProductoRequest,
   addProductosRequest,
   updateProductoRequest,
   */} from "../routes/api.productos";
import { useState, useEffect } from 'react'

export function transformData(productos) {
  const productosTransformados = productos.map((producto) => ({
      precio: parseFloat(producto.precio),
      descripcion: producto.descripcion.toUpperCase(),
      nom_subcat: producto.nom_subcat.toUpperCase(),
      nom_marca: producto.nom_marca.toUpperCase(),
      cod_barras: producto.cod_barras || "-",
      undm: producto.undm.toUpperCase(),
      estado: parseInt(producto.estado) === 0 ? "Inactivo" : "Activo",
  }));

  return productosTransformados;
}

export function ShowProductos() {

  const [productos, setProductos] = useState([]);
  useEffect(() => {
    getProductos()
  }, []);

  // Obtener todos los productos
  const getProductos = async () => {
    const res = await getProductosRequest();
    const dataTransformada = transformData(res.data.data)
    setProductos(dataTransformada);
  };
}