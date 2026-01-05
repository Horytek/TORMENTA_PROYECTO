import { getMarcasRequest, getMarcaRequest, addMarcasRequest, deleteMarcaRequest, updateMarcaRequest, deactivateMarcaRequest, importExcelRequest }
  from '@/api/api.marca';
import { useState } from "react";
import { toast } from "react-hot-toast";

const getMarcas = async () => {
  try {
    const response = await getMarcasRequest();
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const getMarca = async (id) => {
  try {
    const response = await getMarcaRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }

  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
}

const addMarca = async (marca) => {
  try {
    const response = await addMarcasRequest(marca);
    if (response.data.code === 1) {
      toast.success("Marca añadido con éxito");
      return [true, response.data.id];
    } else {
      toast.error("Ocurrió un error al guardar la marca");
      return [false];
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const deleteMarca = async (id) => {
  try {
    const response = await deleteMarcaRequest(id);
    if (response.data.code === 1) {
      toast.success("Marca eliminada con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al eliminar la marca");
      return false;
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error en el servidor interno");
    }
  }
}

const updateMarca = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const editMarca = async ({ id_marca, nom_marca, estado_marca }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await updateMarcaRequest(id_marca, {
        id_marca,
        nom_marca,
        estado_marca
      });

      if (response.data && response.data.message) {
        // toast.success(response.data.message);
        return true;
      } else {
        return false;
        //  toast.success("Marca actualizada con éxito");
      }
    } catch (err) {
      setError(err);
      return false;
      // toast.error("Error al actualizar la marca");
    } finally {
      setLoading(false);
    }
  };

  return { editMarca, loading, error };
};

const deactivateMarca = async (id) => {
  try {
    const response = await deactivateMarcaRequest(id);
    if (response.data.message === 'Marca dada de baja con éxito') {
      toast.success("Marca desactivada con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al desactivar la marca");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
}

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

export { getMarcas, getMarca, addMarca, deleteMarca, updateMarca, deactivateMarca, importExcel };
