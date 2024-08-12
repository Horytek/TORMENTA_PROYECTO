import { getSubcategoriasRequest, getSubcategoriasForCategoriasRequest, getSubcategoriaNomCategoriaRequest, addSubcategoriaRequest, updateSubcategoriaRequest, deleteSubcategoriaRequest, deactivateSubcategoriaRequest } 
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
      setTimeout(() => {
        window.location.reload();
      }, 400); 
    

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
      console.log("Subcategorías data:", response.data.data); 
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      toast.error(`Error en la solicitud: ${response.data.message}`);
      return []; 
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    toast.error(`Error en la solicitud: ${error.message}`);
    return []; 
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

const deleteSubcategoria = async (id) => {
  try {
    const response = await deleteSubcategoriaRequest(id);
    if (response.data.code === 1) {
      toast.success("Subcategoría eliminada con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al eliminar la categoría");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
}

const deactivateSubcategoria = async (id) => {
  try {
    const response = await deactivateSubcategoriaRequest(id);
    if (response.data.message === "Subcategoría dada de baja con éxito") {
      toast.success("Subcategoría dada de baja con éxito");
      return true;
    } else {
      toast.error("Ocurrio un error al desactivar la subcategoria");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
}

export { getSubcategorias, getSubcategoriasForCategoria, getSubcategoriaNomCategoria, addSubcategoria, updateSubcategoria, deleteSubcategoria, deactivateSubcategoria };