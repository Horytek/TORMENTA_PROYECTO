import { getProductosRequest, deleteProductosRequest } from '@/api/api.productos';
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

const deleteProducto = async (id) => {
  try {
    const response = await deleteProductosRequest(id);

    if (response.data.code === 2) {
      console.log(`Producto con ID ${id} dado de baja exitosamente.`);
      return true; // Indicar éxito
    }

    if (response.data.code === 1) {
      console.log(`Producto con ID ${id} eliminado exitosamente.`);
      return true; // Indicar éxito
    }

    if (response.status === 404) {
      console.log(`Ocurrio un error al eliminar el producto con ID ${id}.`);
      return false; // Indicar éxito
    }

  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return false; // Indicar fallo
  }
};

export { getProductos, deleteProducto };