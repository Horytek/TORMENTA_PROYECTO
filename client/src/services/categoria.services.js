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
      if (response.data.code === 1) {
        return response.data.data;
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
};

const getCategoria = async (id) => { 
    try {
      const response = await getCategoriaRequest(id);
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
        toast.success("Categoría añadida con éxito");
        return [true, response.data.id];
      } else {
        toast.error("Ocurrió un error al guardar la categoría");
        return [false];
      }
    } catch (error) {
      toast.error("Error en el servidor interno");
    }
};

const deleteCategoria = async (id) => {
    try {
      const response = await deleteCategoriaRequest(id);
      if (response.data.code === 1) {
        toast.success("Categoría eliminada con éxito");
        return true;
      } else {
        toast.error("Ocurrió un error al eliminar la categoría");
        return false;
      }
    } catch (error) {
      toast.error("Error en el servidor interno");
    }
};

const deactivateCategoria = async (id) => {
    try {
      const response = await deactivateCategoriaRequest(id);
      if (response.data.message === "Categoría dada de baja con éxito") {
        toast.success("Categoría desactivada con éxito");
        return true;
      } else {
        toast.error("Ocurrió un error al desactivar la categoría");
        return false;
      }
    } catch (error) {
      toast.error("Error en el servidor interno");
    }
};

const updateCategoria = async (id, categoria) => {
    try {
      const response = await updateCategoriaRequest(id, categoria);
      if (response.data.code === 1) {
        toast.success("Categoría actualizada con éxito");
        return true;
      } else {
        toast.error("Ocurrió un error al actualizar la categoría");
        return false;
      }
    } catch (error) {
      toast.error("Error en el servidor interno");
    }
};

export { getCategorias, getCategoria, addCategoria, deleteCategoria, deactivateCategoria, updateCategoria };
