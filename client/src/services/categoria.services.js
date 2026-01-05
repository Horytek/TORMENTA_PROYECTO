import { useState } from "react";
import {
  getCategoriasRequest,
  getCategoriaRequest,
  addCategoriaRequest,
  deleteCategoriaRequest,
  deactivateCategoriaRequest,
  updateCategoriaRequest,
  importExcelRequest
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
    if (error.response && error.response.data && error.response.data.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error en el servidor");
    }
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
}

const useEditCat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const editCat = async ({ id_categoria, nom_categoria, estado_categoria }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await updateCategoriaRequest(id_categoria, {
        id_categoria,
        nom_categoria,
        estado_categoria
      });

      if (response.data && response.data.message) {
        // toast.success(response.data.message);
      } else {
        //  toast.success("Categoría actualizada con éxito");
      }
    } catch (err) {
      setError(err);
      // toast.error("Error al actualizar la categoria");
    } finally {
      setLoading(false);
    }
  };

  return { editCat, loading, error };
};

const importExcel = async (data) => {
  try {
    const response = await importExcelRequest(data);
    if (response.data.code === 1) {
      toast.success(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn("Import warnings:", response.data.errors);
        toast.error(`Importado con ${response.data.errors.length} errores. Revisa la consola.`);
      }
      return true;
    } else {
      toast.error(response.data.message || "Error al importar");
      return false;
    }
  } catch (error) {
    console.error("Import error:", error);
    toast.error(error.response?.data?.message || "Error en el servidor");
    return false;
  }
};

export {
  getCategorias,
  getCategoria,
  addCategoria,
  deleteCategoria,
  deactivateCategoria,
  useEditCat,
  updateCategoria,
  importExcel
};
