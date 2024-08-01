import { getProductosRequest, deleteProductosRequest } from '@/api/api.productos';
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

const deleteProducto = async (id) => {
  try {
    const response = await deleteProductosRequest(id);

    // Producto dado de baja (estado a 0)
    if (response.data.code === 2) {
      toast.success("Producto dado de baja con éxito");
    }
    // Producto eliminado
    if (response.data.code === 1) {
      toast.success("Producto eliminado con éxito");
    }
    // Error 404
    if (response.status === 404) {
      toast.error("Ocurrió un error al eliminar el producto");
    }

  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

export { getProductos, deleteProducto };