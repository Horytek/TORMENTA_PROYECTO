
import { createContext, useContext } from "react";

const ProductoContext = createContext();

export const useProductoContext = () => {
  const context = useContext(ProductoContext);
  if (!context) {
    throw new Error("useProductoContext must be used within a ProductoProvider");
  }
  return context;
};

export default ProductoContext;