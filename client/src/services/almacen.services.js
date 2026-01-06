import { getAlmacenesRequest, getAlmacenesRequest_A, getSucursalesRequest, getAlmacenRequest, addAlmacenRequest, updateAlmacenRequest, deleteAlmacenRequest }
  from '@/api/api.almacen';

import { transformData } from '@/utils/almacen';

const getAlmacenes = async () => {
  try {
    const response = await getAlmacenesRequest();
    if (response.data.code === 1) {
      return transformData(response.data.data);
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error.response ? error.response.data : error.message);
  }
};


const getAlmacenes_A = async () => {
  try {
    const response = await getAlmacenesRequest_A();
    if (response.data.code === 1) {
      return transformData(response.data.data);
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error.response ? error.response.data : error.message);
  }
};

const getSucursales = async () => {
  try {
    const response = await getSucursalesRequest();
    if (response.data.code === 1) {
      return transformData(response.data.data);
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error.response ? error.response.data : error.message);
  }
};

const getAlmacen = async (id) => {
  try {
    const response = await getAlmacenRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error.message);
  }
};



const addAlmacen = async (almacen) => {
  try {
    const response = await addAlmacenRequest(almacen);
    if (response.data.code === 1) {
      return { id_almacen: response.data.id_almacen }; // <-- retorna el id
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const updateAlmacen = async (id, newFields) => {
  try {
    const response = await updateAlmacenRequest(id, newFields);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    // Error logic
  }
};

const deleteAlmacen = async (id) => {
  try {
    const response = await deleteAlmacenRequest(id);
    if (response.data.code === 2) {
      return 2;
    }
    if (response.data.code === 1) {
      return 1;
    }
    if (response.status === 404) {
      return 0;
    }
  } catch (error) {
    return 0;
  }
};

export { getAlmacenes, getAlmacenes_A, getSucursales, getAlmacen, addAlmacen, updateAlmacen, deleteAlmacen, bulkUpdateAlmacenes };

// --- Helper for Frontend Bulk Operations ---
const bulkUpdateAlmacenes = async (action, ids, items = []) => {
  try {
    const promises = ids.map(id => {
      if (action === 'delete') {
        return deleteAlmacen(id);
      } else if (action === 'activate') {
        const item = items.find(i => i.id_almacen === id);
        if (item) return updateAlmacen(id, { ...item, estado_almacen: 1 });
        // Fallback or error if strictly required
        return updateAlmacen(id, { estado_almacen: 1 });
      } else if (action === 'deactivate') {
        const item = items.find(i => i.id_almacen === id);
        if (item) return updateAlmacen(id, { ...item, estado_almacen: 0 });
        return updateAlmacen(id, { estado_almacen: 0 });
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