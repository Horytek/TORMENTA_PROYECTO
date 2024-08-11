import { useContext, useState } from "react";
import { SubcategoriaContext } from "./SubcategoriaContext";
import {
  getSubcategorias,
  addSubcategoria,
  updateSubcategoria,
} from "@/services/subcategoria.services";

export const useSubcategorias = () => {
  const context = useContext(SubcategoriaContext);
  if (context === undefined) {
    throw new Error(
      "useSubcategorias must be used within a SubcategoriaContextProvider"
    );
  }
  return context;
};

export const SubcategoriaContextProvider = ({ children }) => {
  const [subcategorias, setSubcategoria] = useState([]);

  async function loadSubcategorias() {
    const response = await getSubcategorias();
    setSubcategoria(response);
  }

  const createSubcategoria = async (subcategoria) => {
    try {
      const success = await addSubcategoria(subcategoria);
      if (success[0]) {
        const { id_categoria, nom_subcat, estado_subcat } = subcategoria;
        const newSubcategoria = {
          id_subcategoria: success[1],
          id_categoria,
          nom_subcat,
          estado_subcat,
        };
        setSubcategoria([...subcategorias, newSubcategoria]);
      }
      return success;
    } catch (error) {
      console.error(error);
    }
  };

  const updateSubcategoria = async (subcategoria) => {
    try {
      const success = await updateSubcategoria(subcategoria);
      if (success) {
        const updatedSubcategorias = subcategorias.map((subcat) => {
          if (subcat.id_subcategoria === subcategoria.id_subcategoria) {
            return subcategoria;
          }
          return subcat;
        });
        setSubcategoria(updatedSubcategorias);
      }
      return success;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SubcategoriaContext.Provider
      value={{
        subcategorias,
        loadSubcategorias,
        createSubcategoria,
        updateSubcategoria,
      }}
    >
      {children}
    </SubcategoriaContext.Provider>
  );
};
