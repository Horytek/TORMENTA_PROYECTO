import { 
  getCategoriasRequest, 
  getCategoriaRequest,
  addCategoriaRequest, 
  deleteCategoriaRequest, 
  deactivateCategoriaRequest, 
  updateCategoriaRequest 
} from '@/api/api.categoria';
import { toast } from "react-hot-toast";

const getCategorias = async () => {
  try {
    const response = await getCategoriasRequest();
    return response.data.code === 1 ? response.data.data : [];
  } catch (error) {
    console.error("Error al obtener categorías:", error.message);
    return [];
  }
};

const getCategoria = async (id) => {
  try {
    const response = await getCategoriaRequest(id);
    return response.data.code === 1 ? response.data.data : null;
  } catch (error) {
    console.error("Error al obtener categoría:", error.message);
    return null;
  }
};

const addCategoria = async (categoria) => {
  try {
    const response = await addCategoriaRequest(categoria);
    if (response.data.code === 1) {
      toast.success("Categoría añadida con éxito");
      return [true, response.data.id];
    }
    toast.error("Error al añadir categoría");
    return [false];
  } catch (error) {
    toast.error("Error en el servidor");
    return [false];
  }
};

const deleteCategoria = async (id) => {
  try {
    const response = await deleteCategoriaRequest(id);
    if (response.data.code === 1) {
      toast.success("Categoría eliminada");
      return true;
    }
    toast.error("No se pudo eliminar");
    return false;
  } catch (error) {
    toast.error("Error en el servidor");
    return false;
  }
};

const deactivateCategoria = async (id) => {
  try {
    const response = await deactivateCategoriaRequest(id);
    if (response.data.code === 1) {
      toast.success("Categoría desactivada");
      return true;
    }
    toast.error("No se pudo desactivar");
    return false;
  } catch (error) {
    toast.error("Error en el servidor");
    return false;
  }
};

const updateCategoria = async (id, categoria) => {
  try {
    const response = await updateCategoriaRequest(id, categoria);
    if (response.data.code === 1) {
      toast.success("Categoría actualizada");
      return true;
    }
    toast.error("No se pudo actualizar");
    return false;
  } catch (error) {
    toast.error("Error en el servidor");
    return false;
  }
};

export {
  getCategorias,
  getCategoria,
  addCategoria,
  deleteCategoria,
  deactivateCategoria,
  updateCategoria,
};
