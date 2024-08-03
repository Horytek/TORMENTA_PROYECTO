import { getSubcategoriasRequest, getSubcategoriasForCategoriasRequest, addSubcategoriaRequest } 
from '@/api/api.categoria';
import { toast } from "react-hot-toast";

const getSubcategorias = async () => {
    try {
      const response = await getSubcategoriasRequest();
      if (response.data.code === 1) {
        return response.data.data;
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
};

const getSubcategoriasForCategoria = async (id) => {
    try {
      const response = await getSubcategoriasForCategoriasRequest(id);
      if (response.data.code === 1) {
        return response.data.data;
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
  };

const addSubcategoria = async (subcategoria) => {
    try {
      const response = await addSubcategoriaRequest(subcategoria);
      if (response.data.code === 1) {
        toast.success("Subcategoría añadido con éxito");
        return true;
      } else {
        toast.error("Ocurrió un error al guardar la subcategoría");
        return false;
      }
    } catch (error) {
      toast.error("Error en el servidor interno");
    }
};

export { getSubcategorias, getSubcategoriasForCategoria, addSubcategoria };