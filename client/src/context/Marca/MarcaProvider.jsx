import { useContext, useState } from "react";
import { MarcaContext } from "./MarcaContext";
import { getMarcas, addMarca } from "@/services/marca.services";

export const useMarcas = () => {
    const context = useContext(MarcaContext);
    if (context === undefined) {
      throw new Error("useMarcas must be used within a MarcaContextProvider");
    }
    return context;
};

export const TaskContextProvider = ({ children }) => {
    const [marcas, setMarcas] = useState([]);
  
    async function loadMarcas() {
      const response = await getMarcas();
      setMarcas(response);
    }
  
    const createMarca = async (marca) => {
      try {
        const success = await addMarca(marca);
        if (success) {
          setMarcas([...marcas, marca]);
        }
      } catch (error) {
        console.error(error);
      }
    };
  
    return (
      <MarcaContext.Provider
        value={{
          marcas,
          loadMarcas,
          createMarca
        }}
      >
        {children}
      </MarcaContext.Provider>
    );
  };