import { useContext, useState, useCallback } from "react";
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
  
    const loadCategorias = useCallback(async () => {
      try {
        const response = await getCategorias();
        if (JSON.stringify(categorias) !== JSON.stringify(response)) {
          setCategoria(response);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    }, [categorias]); // Memoiza la función y la referencia no cambiará a menos que 'categorias' cambie
    
    const createCategoria = useCallback(async (categoria) => {
      try {
        const success = await addCategoria(categoria);
        if (success[0]) {
          const { nom_categoria, estado_categoria } = categoria;
          const newCategoria = {
            id_categoria: success[1],
            nom_categoria,
            estado_categoria,
          };
          setCategoria((prevCategorias) => [...prevCategorias, newCategoria]); 
        }
        return success;
      } catch (error) {
       // console.error(error);
      }
    }, []); 
  
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
