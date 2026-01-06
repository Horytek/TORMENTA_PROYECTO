import {
  getVendedoresRequest,
  getVendedorRequest,
  addVendedorRequest,
  deleteVendedorRequest,
  updateVendedorRequest,
  deactivateVendedorRequest
} from '@/api/api.vendedor';

import { transformData } from '@/utils/vendedor';

// Función para obtener todos los vendedores
const getVendedores = async () => {
  try {
    const response = await getVendedoresRequest();
    if (response.data.code === 1) {
      return transformData(response.data.data);
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

// Función para obtener un vendedor por ID
const getVendedor = async (id) => {
  try {
    const response = await getVendedorRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

// Función para añadir un nuevo vendedor
const addVendedor = async (vendedor) => {
  try {
    const response = await addVendedorRequest(vendedor);
    if (response.data.code === 1) {
      return [true, response.data.id];
    } else {
      return [false, response.data.message || "Error al guardar"];
    }
  } catch (error) {
    return [false, "Error en el servidor interno"];
  }
};

// Función para eliminar un vendedor
const deleteVendedor = async (id) => {
  try {
    const response = await deleteVendedorRequest(id);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

// Función para actualizar un vendedor
const updateVendedor = async (id, vendedor) => {
  try {
    const response = await updateVendedorRequest(id, vendedor);
    if (response.data.code === 1) {
      return [true];
    } else {
      return [false, response.data.message || "Error al actualizar"];
    }
  } catch (error) {
    return [false, "Error en el servidor interno"];
  }
};


// Función para desactivar un vendedor
// Función para desactivar o eliminar un vendedor
const deactivateVendedor = async (id) => {
  try {
    const response = await deactivateVendedorRequest(id);

    if (response.data.message.includes("Vendedor dado de baja")) {
      return true;
    }
    if (response.data.message.includes("Vendedor eliminado")) {
      return true;
    }
    if (response.status === 404) {
      return false;
    }

    return false;
  } catch (error) {
    console.error("Error al desactivar/eliminar el vendedor:", error);
    return false;
  }
};


export { getVendedores, getVendedor, addVendedor, deleteVendedor, updateVendedor, deactivateVendedor, bulkUpdateVendedores };

// --- Helper for Frontend Bulk Operations ---
const bulkUpdateVendedores = async (action, ids, items = []) => {
  try {
    const promises = ids.map(id => {
      if (action === 'delete') {
        return deleteVendedor(id);
      } else if (action === 'deactivate') {
        const item = items.find(i => i.dni === id) || items.find(i => i.id === id); // Fallback for ID field
        if (item) return updateVendedor(id, { ...item, estado_vendedor: 0 });
        // Fallback or skip if not found, since controller requires validation
        console.warn("Item not found for deactivate, trying partial but likely to fail", id);
        return updateVendedor(id, { estado_vendedor: 0 });
      } else if (action === 'activate') {
        const item = items.find(i => i.dni === id) || items.find(i => i.id === id);
        if (item) return updateVendedor(id, { ...item, estado_vendedor: 1 });
        return updateVendedor(id, { estado_vendedor: 1 });
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
