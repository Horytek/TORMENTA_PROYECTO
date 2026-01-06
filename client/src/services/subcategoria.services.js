import { useState, useEffect } from "react";
import {
  getSubcategoriasRequest,
  getSubcategoriasForCategoriasRequest,
  getSubcategoriaNomCategoriaRequest,
  addSubcategoriaRequest,
  updateSubcategoriaRequest,
  deleteSubcategoriaRequest,
  deactivateSubcategoriaRequest,
  getSubcategoriaRequest,
  getSubcategoriasConCategoriaRequest,
  importExcelRequest
} from '@/api/api.subcategoria';


// Obtener todas las subcategorías
const getSubcategorias = async () => {
  try {
    const response = await getSubcategoriasRequest();
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
};

// Obtener subcategorías por categoría
const getSubcategoriasForCategoria = async (id) => {
  try {
    const response = await getSubcategoriasForCategoriasRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
};

// Obtener subcategorías con nombre de categoría
const getSubcategoriaNomCategoria = async () => {
  try {
    const response = await getSubcategoriaNomCategoriaRequest();
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
};

// Obtener una subcategoría por ID
const getSubcategoriaById = async (id) => {
  try {
    const response = await getSubcategoriaRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// Obtener subcategorías con datos de categoría (lista extendida)
const useSubcategoriasConCategoria = () => {
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubcategorias = async () => {
      try {
        const response = await getSubcategoriasConCategoriaRequest();
        setSubcategorias(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategorias();
  }, []);

  return { subcategorias, loading, error };
};

// Agregar subcategoría
const addSubcategoria = async (subcategoria) => {
  try {
    const response = await addSubcategoriaRequest(subcategoria);
    if (response.data.code === 1) {
      return [true, response.data.id];
    } else {
      return [false];
    }
  } catch (error) {
    return [false];
  }
};

// Actualizar subcategoría
const useEditSubCategoria = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const editSubCategoria = async ({ id_subcategoria, id_categoria, nom_subcat, estado_subcat, nom_categoria, estado_categoria }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await updateSubcategoriaRequest(id_subcategoria, {
        id_subcategoria,
        id_categoria,
        nom_subcat,
        estado_subcat,
        nom_categoria,
        estado_categoria
      });

      // Handle response without console.log
      if (response.data && response.data.message) {

      } else {
      }
    } catch (err) {

      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { editSubCategoria, loading, error };
};

// Eliminar subcategoría
const useDeleteSubcategoria = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const deleteSubcategoria = async (id) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await deleteSubcategoriaRequest(id);
      if (response.data.code === 1) {
        setSuccess(true);
        return true;
        // Aquí puedes llamar a un callback para refrescar la lista en el componente padre
      } else {
        return false;
      }
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteSubcategoria, loading, error, success, setSuccess };
};

// Desactivar subcategoría
const useDeactivateSubcategoria = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const deactivateSubcategoria = async (id) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await deactivateSubcategoriaRequest(id);
      if (response.data.message === "Subcategoría dada de baja con éxito") {
        setSuccess(true);
        return true;
        // Aquí puedes llamar a un callback para refrescar la lista en el componente padre
      } else {
        return false;
      }
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deactivateSubcategoria, loading, error, success, setSuccess };
};

// Actualizar subcategoría
const updateSubcategoria = async (id, subcategoria) => {
  try {
    const response = await updateSubcategoriaRequest(id, subcategoria);
    if (response.data.code === 1 || response.data.message?.includes("actualizadas con éxito")) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
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
  getSubcategorias,
  getSubcategoriasForCategoria,
  getSubcategoriaNomCategoria,
  getSubcategoriaById,
  useSubcategoriasConCategoria,
  addSubcategoria,
  useEditSubCategoria,
  useDeleteSubcategoria,
  useDeactivateSubcategoria,
  updateSubcategoria,
  importExcel,
  bulkUpdateSubcategorias
};

// --- Helper for Frontend Bulk Operations ---
const bulkUpdateSubcategorias = async (action, ids, items = []) => {
  try {
    const promises = ids.map(id => {
      if (action === 'delete') {
        return deleteSubcategoriaRequest(id); // Using request directly or duplicate logic from useDeleteSubcategoria
      } else if (action === 'activate') {
        const item = items.find(i => i.id_subcategoria === id);
        if (item) return updateSubcategoriaRequest(id, { ...item, estado_subcat: 1 });
        return updateSubcategoriaRequest(id, { estado_subcat: 1 });
      } else if (action === 'deactivate') {
        const item = items.find(i => i.id_subcategoria === id);
        if (item) return updateSubcategoriaRequest(id, { ...item, estado_subcat: 0 });
        return updateSubcategoriaRequest(id, { estado_subcat: 0 });
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