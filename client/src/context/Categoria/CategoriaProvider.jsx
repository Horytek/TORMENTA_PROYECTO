import { useContext, useState } from "react";
import { CategoriaContext } from "./CategoriaContext";
import { getCategorias, addCategoria } from "@/services/categoria.services";

export const useCategorias = () => {
    const context = useContext(CategoriaContext);
    if (context === undefined) {
      throw new Error("useCategorias must be used within a CategoriaContextProvider");
    }
    return context;
};

export const TaskContextProvider = ({ children }) => {
    const [categoria, setCategoria] = useState([]);
  
    async function loadCategorias() {
      const response = await getCategorias();
      setCategoria(response);
    }
  
    const createCategoria = async (categoria) => {
      try {
        const success = await addCategoria(categoria);
        if (success) {
          setCategoria([...categoria, categoria]);
        }
      } catch (error) {
        console.error(error);
      }
    };
  
    return (
      <CategoriaContext.Provider
        value={{
          categoria,
          loadCategorias,
          createCategoria
        }}
      >
        {children}
      </CategoriaContext.Provider>
    );
};