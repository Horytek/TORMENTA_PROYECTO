import { getCategoriasRequest, addCategoriaRequest } 
from '@/api/api.categoria';
import { toast } from "react-hot-toast";

const getCategorias = async () => {
    try {
      const response = await getCategoriasRequest();
      if (response.data.code === 1) {
        return response.data.data;
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
};

const addCategoria = async (categoria) => {
    try {
      const response = await addCategoriaRequest(categoria);
      if (response.data.code === 1) {
        toast.success("Categoría añadido con éxito");
        return true;
      } else {
        toast.error("Ocurrió un error al guardar la categoría");
        return false;
      }
    } catch (error) {
      toast.error("Error en el servidor interno");
    }
};

export { getCategorias, addCategoria };

