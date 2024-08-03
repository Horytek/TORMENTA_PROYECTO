import { useContext, useState } from "react";
import { SubcategoriaContext } from "./SubcategoriaContext";
import { getSubcategorias, getSubcategoriasForCategoria, addSubcategoria } from "@/services/subcategoria.services";

export const useSubcategorias = () => {
    const context = useContext(SubcategoriaContext);
    if (context === undefined) {
      throw new Error("useSubcategorias must be used within a SubcategoriaContextProvider");
    }
    return context;
};

export const SubcategoriaContextProvider = ({ children }) => {
    const [subcategoria, setSubcategoria] = useState([]);
  
    async function loadCategorias() {
      const response = await getSubcategorias();
      setSubcategoria(response);
    }

    const loadSubCategoriasForCategoria = async (id) => {
        const response = await getSubcategoriasForCategoria(id);
        return response;
    };
  
    const createCategoria = async (subcategoria) => {
      try {
        const success = await addSubcategoria(subcategoria);
        if (success) {
          setSubcategoria([...subcategoria, subcategoria]);
        }
      } catch (error) {
        console.error(error);
      }
    };
  
    return (
      <SubcategoriaContext.Provider
        value={{
          subcategoria,
          loadCategorias,
          loadSubCategoriasForCategoria,
          createCategoria
        }}
      >
        {children}
      </SubcategoriaContext.Provider>
    );
};