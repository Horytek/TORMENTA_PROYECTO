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
      return [true, response.data.id];
    }
    return [false];
  } catch (error) {
    return [false];
  }
};

const deleteCategoria = async (id) => {
  try {
    const response = await deleteCategoriaRequest(id);
    if (response.data.code === 1) {
      return true;
    }
    return false;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      // Error Logic
    } else {
      // Error Logic
    }
    return false;
  }
};

const deactivateCategoria = async (id) => {
  try {
    const response = await deactivateCategoriaRequest(id);
    if (response.data.code === 1) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const updateCategoria = async (id, categoria) => {
  try {
    const response = await updateCategoriaRequest(id, categoria);
    if (response.data.code === 1) {
      return true;
    }
    return false;
  } catch (error) {
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
        // Success
      } else {
        // Success
      }
    } catch (err) {
      setError(err);
      // Error
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
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn("Import warnings:", response.data.errors);
      }
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Import error:", error);
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
  importExcel,
  bulkUpdateCategorias
};

// --- Helper for Frontend Bulk Operations ---
const bulkUpdateCategorias = async (action, ids, items = []) => {
  try {
    const promises = ids.map(id => {
      if (action === 'delete') {
        return deleteCategoria(id);
      } else if (action === 'activate') {
        const item = items.find(i => i.id_categoria === id);
        if (item) return updateCategoria(id, { ...item, estado_categoria: 1 });
        return updateCategoria(id, { estado_categoria: 1 });
      } else if (action === 'deactivate') {
        const item = items.find(i => i.id_categoria === id);
        if (item) return updateCategoria(id, { ...item, estado_categoria: 0 });
        return updateCategoria(id, { estado_categoria: 0 });
      }
      return Promise.resolve(false);
    });

    await Promise.all(promises);
    return true;
  } catch (e) {
    console.error("Bulk update error", e);
    return false;
  }
};
