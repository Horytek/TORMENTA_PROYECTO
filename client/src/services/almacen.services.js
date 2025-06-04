import { getAlmacenesRequest, getSucursalesRequest ,getAlmacenRequest, addAlmacenRequest, updateAlmacenRequest, deleteAlmacenRequest } 
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

  

const addAlmacen= async (almacen) => {
  try {
    const response = await addAlmacenRequest(almacen);
    if (response.data.code === 1) {
      toast.success("Almacén añadido con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al guardar el almacén");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
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
    }
    if (response.data.code === 1) {
      toast.success("Almacén eliminado con éxito");
    }
    if (response.status === 404) {
      toast.error("Ocurrió un error al eliminar el almacén");
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

export { getAlmacenes, getSucursales ,getAlmacen, addAlmacen, updateAlmacen, deleteAlmacen };