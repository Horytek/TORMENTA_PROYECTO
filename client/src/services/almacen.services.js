import { getAlmacenesRequest,getAlmacenesRequest_A, getSucursalesRequest ,getAlmacenRequest, addAlmacenRequest, updateAlmacenRequest, deleteAlmacenRequest } 
from '@/api/api.almacen';
import { toast } from "react-hot-toast";
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
      toast.success("Almacén añadido con éxito");
      return { id_almacen: response.data.id_almacen }; // <-- retorna el id
    } else {
      toast.error("Ocurrió un error al guardar el almacén");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
    return false;
  }
};

const updateAlmacen = async (id, newFields) => {
  try {
    const response = await updateAlmacenRequest(id, newFields);
    if (response.data.code === 1) {
      toast.success("Almacén actualizado con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al actualizar el almacén");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const deleteAlmacen = async (id) => {
  try {
    const response = await deleteAlmacenRequest(id);
    if (response.data.code === 2) {
      toast.success("Almacén dado de baja con éxito");
      return 2;
    }
    if (response.data.code === 1) {
      toast.success("Almacén eliminado con éxito");
      return 1;
    }
    if (response.status === 404) {
      toast.error("Ocurrió un error al eliminar el almacén");
      return 0;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
    return 0;
  }
};

export { getAlmacenes,getAlmacenes_A, getSucursales ,getAlmacen, addAlmacen, updateAlmacen, deleteAlmacen };