import { getMarcasRequest, getMarcaRequest, addMarcasRequest, deleteMarcaRequest, updateMarcaRequest, deactivateMarcaRequest, importExcelRequest }
  from '@/api/api.marca';
import { useState } from "react";


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
      return [true, response.data.id];
    } else {
      return [false];
    }
  } catch (error) {
    return [false];
  }
};

const deleteMarca = async (id) => {
  try {
    const response = await deleteMarcaRequest(id);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      // Logic for error
    } else {
      // Logic for error
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
        return true;
      } else {
        return false;
      }
    } catch (err) {
      setError(err);
      return false;
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
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

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

export { getMarcas, getMarca, addMarca, deleteMarca, updateMarca, deactivateMarca, importExcel, bulkUpdateMarcas };

// --- Helper for Frontend Bulk Operations ---
const bulkUpdateMarcas = async (action, ids, items = []) => {
  try {
    const promises = ids.map(id => {
      if (action === 'delete') {
        return deleteMarca(id);
      } else if (action === 'activate') {
        const item = items.find(i => i.id_marca === id);
        if (item) return updateMarcaRequest(id, { ...item, estado_marca: 1 });
        return updateMarcaRequest(id, { id_marca: id, estado_marca: 1 });
      } else if (action === 'deactivate') {
        const item = items.find(i => i.id_marca === id);
        if (item) return updateMarcaRequest(id, { ...item, estado_marca: 0 });
        return updateMarcaRequest(id, { id_marca: id, estado_marca: 0 });
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
