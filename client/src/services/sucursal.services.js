import {
  getSucursalInicioRequest,
  getSucursalesRequest,
  getVendedoresRequest,
  insertSucursalRequest,
  updateSucursalRequest,
  deleteSucursalRequest
} from '@/api/api.sucursal';

import { useState, useEffect } from 'react';

// Obtener la sucursal de inicio (filtro por nombre opcional)
const getSucursalInicio = async (filters = {}) => {
  try {
    const response = await getSucursalInicioRequest(filters);
    return response.data.code === 1 ? response.data.data : null;
  } catch (error) {
    //console.error("Error al obtener la sucursal de inicio:", error.message);
    return null;
  }
};

// Obtener todas las sucursales con filtros
const getSucursalData = async (filters) => {
  try {

    const response = await getSucursalesRequest(filters);

    if (response.data.code === 1) {
      return { sucursales: response.data.data };
    } else {
      //console.error('Error en la solicitud: ', response.data.message);
      return { sucursales: [] };
    }
  } catch (error) {
    //console.error('Error en la solicitud: ', error.message);
    return { sucursales: [] };
  }
};

// Obtener la lista de vendedores activos
const useVendedoresData = () => {
  const [vendedores, setVendedores] = useState([]);

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        // Hacer la solicitud al endpoint que obtiene los vendedores
        const response = await getVendedoresRequest();

        if (response.data.code === 1) {
          // Mapear los datos para adaptarlos a la estructura esperada
          const vendedores = response.data.data.map(item => ({
            dni: item.dni, // DNI del vendedor
            nombre: item.nombre_completo, // Nombre completo del vendedor
          }));
          setVendedores(vendedores); // Guardar la lista de vendedores en el estado
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchVendedores();
  }, []);

  return { vendedores, setVendedores };
};

// Insertar nueva sucursal
const insertSucursal = async (sucursal) => {
  try {
    const response = await insertSucursalRequest(sucursal);
    if (response.data.code === 1) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// Actualizar una sucursal existente
const editSucursal = async (sucursal) => {
  try {
    const response = await updateSucursalRequest(sucursal);
    if (response.data.code === 1) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// Eliminar una sucursal por ID
const removeSucursal = async (id) => {
  try {
    const response = await deleteSucursalRequest(id);
    if (response.data.code === 1) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// --- Helper for Frontend Bulk Operations ---
const bulkUpdateSucursales = async (action, ids, items = []) => {
  try {
    const promises = ids.map(id => {
      if (action === 'delete') {
        return removeSucursal(id);
      } else if (action === 'activate') {
        const item = items.find(i => i.id === id) || items.find(i => i.id_sucursal === id);
        if (item) return editSucursal({ ...item, estado_sucursal: 1 });
        return editSucursal({ id, estado_sucursal: 1 });
      } else if (action === 'deactivate') {
        const item = items.find(i => i.id === id) || items.find(i => i.id_sucursal === id);
        if (item) return editSucursal({ ...item, estado_sucursal: 0 });
        return editSucursal({ id, estado_sucursal: 0 });
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
    return true;
  } catch (e) {
    console.error("Bulk update error", e);
    return false;
  }
};

export {
  getSucursalInicio,
  getSucursalData,
  useVendedoresData,
  insertSucursal,
  editSucursal,
  removeSucursal,
  bulkUpdateSucursales
};
