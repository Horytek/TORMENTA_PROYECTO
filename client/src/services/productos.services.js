import { getProductosRequest, getProductoRequest, addProductosRequest, updateProductoRequest, deleteProductosRequest, getLastIdProductoRequest, importExcelRequest }
  from '@/api/api.productos';
import { transformData } from '@/utils/producto';
import { toast } from "react-hot-toast";

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

const addProducto = async (producto) => {
  try {
    const response = await addProductosRequest(producto);
    if (response.data.code === 1) {
      toast.success("Producto añadido con éxito");
      // Devuelve el id insertado
      return { success: true, id_producto: response.data.id_producto };
    } else {
      toast.error("Ocurrió un error al guardar el producto");
      return { success: false };
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
    return { success: false };
  }
};

const updateProducto = async (id, newFields) => {
  try {
    const response = await updateProductoRequest(id, newFields);
    if (response.data.code === 1) {
      toast.success("Producto actualizado con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al actualizar el producto");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const deleteProducto = async (id) => {
  try {
    const response = await deleteProductosRequest(id);
    if (response.data.code === 2) {
      toast.success("Producto dado de baja con éxito");
      return true;
    }
    if (response.data.code === 1) {
      toast.success("Producto eliminado con éxito");
      return true;
    }
    if (response.status === 404) {
      toast.error("Ocurrió un error al eliminar el producto");
      return false;
    }
    return false;
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

export { getProductos, getLastIdProducto, getProducto, addProducto, updateProducto, deleteProducto, importExcel };