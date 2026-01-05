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
import { toast } from "react-hot-toast";

// Obtener todas las subcategorías
const getSubcategorias = async () => {
  try {
    const response = await getSubcategoriasRequest();
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      toast.error(response.data.message || 'Error al obtener subcategorías');
      return [];
    }
  } catch (error) {
    toast.error('Error en la solicitud: ' + error.message);
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
      toast.error(response.data.message || 'Error al obtener subcategorías por categoría');
      return [];
    }
  } catch (error) {
    toast.error('Error en la solicitud: ' + error.message);
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
      toast.error(response.data.message || 'Error al obtener subcategorías');
      return [];
    }
  } catch (error) {
    toast.error('Error en la solicitud: ' + error.message);
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
      toast.error(response.data.message || 'Error al obtener la subcategoría');
      return null;
    }
  } catch (error) {
    toast.error('Error en la solicitud: ' + error.message);
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
      toast.success("Subcategoría añadida con éxito");
      return [true, response.data.id];
    } else {
      toast.error("Ocurrió un error al guardar la subcategoría");
      return [false];
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
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
        toast.success("Subcategoría eliminada con éxito");
        return true;
        // Aquí puedes llamar a un callback para refrescar la lista en el componente padre
      } else {
        toast.error("Error al eliminar la subcategoría");
        return false;
      }
    } catch (err) {
      setError(err.message);
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Error en el servidor interno");
      }
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
        toast.success("Subcategoría dada de baja con éxito");
        return true;
        // Aquí puedes llamar a un callback para refrescar la lista en el componente padre
      } else {
        toast.error("Error al desactivar la subcategoría");
        return false;
      }
    } catch (err) {
      setError(err.message);
      toast.error("Error en el servidor interno");
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
      toast.success("Subcategoría actualizada con éxito");
      return true;
    } else {
      toast.error("No se pudo actualizar la subcategoría");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
    return false;
  }
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
  importExcel
};