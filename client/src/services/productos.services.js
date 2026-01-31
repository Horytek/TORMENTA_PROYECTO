import { getProductosRequest, getProductoRequest, addProductosRequest, updateProductoRequest, deleteProductosRequest, getLastIdProductoRequest, importExcelRequest, getProductVariantsRequest, registerProductVariantsRequest, getProductAttributesRequest, generateSKUsRequest }
  from '@/api/api.productos';
import { transformData } from '@/utils/producto';


const getProductos = async () => {
  try {
    const response = await getProductosRequest();
    if (response.data.code === 1) {
      return transformData(response.data.data); // Devuelve el array de productos transformados en el formato deseado
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const getLastIdProducto = async () => {
  try {
    const response = await getLastIdProductoRequest();
    if (response.data.code === 1) {
      return response.data.data[0].ultimo_id;
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
}

const getProducto = async (id) => {
  try {
    const response = await getProductoRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const getProductVariants = async (id, includeZero = false, almacen, id_sucursal) => {
  try {
    const params = { includeZero };
    if (almacen) params.almacen = almacen;
    if (id_sucursal) params.id_sucursal = id_sucursal;
    const response = await getProductVariantsRequest(id, params);
    if (response.data.code === 1) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return [];
  }
};

const getProductAttributes = async (id) => {
  try {
    const response = await getProductAttributesRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    }
    return { tonalidades: [], tallas: [] };
  } catch (error) {
    console.error('Error en getProductAttributes:', error.message);
    return { tonalidades: [], tallas: [] };
  }
};

const generateSKUs = async (id_producto, attributes) => {
  try {
    // attributes: [{ id_atributo: 1, values: [{id: 10, label: 'Rojo'}] }]
    const response = await generateSKUsRequest({ id_producto, attributes });
    return response.data.code === 1;
  } catch (error) {
    console.error('Error generateSKUs:', error);
    return false;
  }
};

const registerProductVariants = async (id_producto, tonalidades, tallas) => {
  try {
    const response = await registerProductVariantsRequest({ id_producto, tonalidades, tallas });
    if (response.data.code === 1) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error registerProductVariants:', error);
    return false;
  }
};



const addProducto = async (producto) => {
  try {
    const response = await addProductosRequest(producto);
    if (response.data.code === 1) {
      // Devuelve el id insertado
      return { success: true, id_producto: response.data.id_producto };
    } else {
      return { success: false };
    }
  } catch (error) {
    return { success: false };
  }
};

const updateProducto = async (id, newFields) => {
  try {
    const response = await updateProductoRequest(id, newFields);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const deleteProducto = async (id) => {
  try {
    const response = await deleteProductosRequest(id);
    if (response.data.code === 2) {
      return true;
    }
    if (response.data.code === 1) {
      return true;
    }
    if (response.status === 404) {
      return false;
    }
    return false;
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

// --- Helper for Frontend Bulk Operations ---
const bulkUpdateProductos = async (action, ids, items = []) => {
  try {
    const promises = ids.map(id => {
      if (action === 'delete') {
        return deleteProducto(id);
      } else if (action === 'activate') {
        const item = items.find(i => i.id_producto === id);
        if (item) return updateProducto(id, { ...item, estado_producto: 1 });
        return updateProducto(id, { estado_producto: 1 });
      } else if (action === 'deactivate') {
        const item = items.find(i => i.id_producto === id);
        if (item) return updateProducto(id, { ...item, estado_producto: 0 });
        return updateProducto(id, { estado_producto: 0 });
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

export { getProductos, getLastIdProducto, getProducto, addProducto, updateProducto, deleteProducto, importExcel, bulkUpdateProductos, getProductVariants, registerProductVariants, getProductAttributes, generateSKUs };