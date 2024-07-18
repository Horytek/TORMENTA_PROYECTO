import { useState, useContext } from "react";
import { ProductoContext } from "./ProductoContext";
import {
  getProductos,
  getProducto,
  addProducto,
  updateProducto,
  deleteProducto,
} from '../../services/productos.services';

export const useProductoContext = () => {
  const context = useContext(ProductoContext);
  if (!context) {
    throw new Error("useProductoContext must be used within a ProductoProvider");
  }
  return context;
};

export const ProductoContextProvider = ({ children }) => {

  const [productos, setProductos] = useState([]);

  async function listarProductos() {
    const productos = await getProductos();
    setProductos(productos);
  }

  const obtenerProducto = async (id) => {
    try {
      const producto = await getProducto(id);
      return producto;
    } catch (error) {
      console.error(error);
    }
  };

  const añadirProducto = async (producto) => {
    try {
      const newProducto = await addProducto(producto);
      setProductos([...productos, newProducto]);
    } catch (error) {
      console.error("Error adding producto:", error);
    }
  };

  const modificarProducto = async (id, newFields) => {
    try {
      await updateProducto(id, newFields);
      //const updatedProductos = await getProductos();
      //setProductos(updatedProductos);
    } catch (error) {
      console.error("Error updating producto:", error);
    }
  };

  const eliminarProducto = async (id) => {
    try {
      await deleteProducto(id);
      const updatedProducto = productos.filter((producto) => producto.id !== id);
      setProductos(updatedProducto);
    } catch (error) {
      console.error("Error deleting producto:", error);
    }
  };

  return (
    <ProductoContext.Provider
      value={{
        productos,
        listarProductos,
        obtenerProducto,
        añadirProducto,
        modificarProducto,
        eliminarProducto,
      }}
    >
      {children}
    </ProductoContext.Provider>
  );

};
