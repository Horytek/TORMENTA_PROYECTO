import { getSubcategoriasRequest, getSubcategoriasForCategoriasRequest, getSubcategoriaNomCategoriaRequest, addSubcategoriaRequest, updateSubcategoriaRequest, deactivateSubcategoriaRequest } 
from '@/api/api.subcategoria';
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

const addSubcategoria = async (subcategoria) => {
  try {
    const response = await addSubcategoriaRequest(subcategoria);
    if (response.data.code === 1) {
      toast.success("Subcategoría añadido con éxito");
      return [true, response.data.id];
    } else {
      toast.error("Ocurrió un error al guardar la subcategoría");
      return [false];
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const getSubcategoriaNomCategoria = async () => {
  try {
    const response = await getSubcategoriaNomCategoriaRequest();
    if (response.data.code === 1) {
      console.log("Subcategorías data:", response.data.data); // Debugging: Verify data structure
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      toast.error(`Error en la solicitud: ${response.data.message}`);
      return []; // Return an empty array to avoid potential issues in components
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    toast.error(`Error en la solicitud: ${error.message}`);
    return []; // Return an empty array to avoid potential issues in components
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

const updateSubcategoria = async (subcategoria) => {
  try {
    const response = await updateSubcategoriaRequest(subcategoria);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  }
  catch (error) {
    console.error("Error en el servidor interno");
  }
};

const deactivateSubcategoria = async (id) => {
  try {
    const response = await deactivateSubcategoriaRequest(id);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error en el servidor interno");
  }
}

export { getSubcategorias, getSubcategoriasForCategoria, getSubcategoriaNomCategoria, addSubcategoria, updateSubcategoria, deactivateSubcategoria };