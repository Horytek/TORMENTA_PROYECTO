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

export const CategoriaContextProvider = ({ children }) => {
    const [categorias, setCategoria] = useState([]);
  
    async function loadCategorias() {
      const response = await getCategorias();
      setCategoria(response);
    }
  
    const createCategoria = async (categoria) => {
      try {
        const success = await addCategoria(categoria);
        if (success[0]) {
          const { nom_categoria, estado_categoria } = categoria
          const newCategoria = {
            id_categoria: success[1],
            nom_categoria,
            estado_categoria
          };
          setCategoria([...categorias, newCategoria]);
        }
        return success;
      } catch (error) {
        console.error(error);
      }
    };
  
    return (
      <CategoriaContext.Provider
        value={{
          categorias,
          loadCategorias,
          createCategoria
        }}
      >
        {children}
      </CategoriaContext.Provider>
    );
};