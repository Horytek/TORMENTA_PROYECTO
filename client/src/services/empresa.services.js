import { getEmpresasRequest, getEmpresaRequest, addEmpresaRequest, updateEmpresaRequest, deleteEmpresaRequest } 
from '@/api/api.empresa';
import { toast } from "react-hot-toast";

const getEmpresas = async () => {
  try {
    const response = await getEmpresasRequest();
    if (response.data.code === 1) {
      return response.data.data; 
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const getEmpresa = async (id) => {
  try {
    const response = await getEmpresaRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const addEmpresa = async (producto) => {
  try {
    const response = await addEmpresaRequest(producto);
    if (response.data.code === 1) {
      toast.success("Producto añadido con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al guardar el producto");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const updateEmpresa = async (id, newFields) => {
  try {
    const response = await updateEmpresaRequest(id, newFields);
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

const deleteEmpresa = async (id) => {
  try {
    const response = await deleteEmpresaRequest(id);
    if (response.data.code === 2) {
      toast.success("Producto dado de baja con éxito");
    }
    if (response.data.code === 1) {
      toast.success("Producto eliminado con éxito");
    }
    if (response.status === 404) {
      toast.error("Ocurrió un error al eliminar el producto");
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

export { getEmpresas, getEmpresa, addEmpresa, updateEmpresa, deleteEmpresa };