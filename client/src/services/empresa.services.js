import { getEmpresasRequest, getEmpresaRequest, addEmpresaRequest,
  updateEmpresaRequest, deleteEmpresaRequest, updateEmpresaMonedasRequest } 
from '@/api/api.empresa';
import { getUsuario_1 } from "@/services/usuario.services";
import { toast } from "react-hot-toast";
import { useUserStore } from "@/store/useStore";

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

const getEmpresaDataByUser = async (nombre) => {
  try {
    if (!nombre) {
      throw new Error("No se encontró el usuario");
    }
    const usuarioDataArray = await getUsuario_1(nombre);
    if (!Array.isArray(usuarioDataArray) || usuarioDataArray.length === 0) {
      throw new Error("No se encontraron datos para el usuario actual.");
    }
    const usuarioData = usuarioDataArray[0];
    if (!usuarioData.id_empresa) {
      throw new Error("No se encontró el id_empresa para el usuario actual.");
    }
    const id_empresa = usuarioData.id_empresa;
    const empresaData = await getEmpresa(id_empresa);
    return empresaData[0];
  } catch (error) {
    throw error;
  }
};

const updateEmpresaMonedas = async (id, monedas) => {
  try {
    const response = await updateEmpresaMonedasRequest(id, monedas);
    if (response.data.code === 1) {
      toast.success("Monedas actualizadas correctamente");
      return true;
    } else {
      toast.error(response.data.message || "Error al actualizar monedas");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
    return false;
  }
};


export { getEmpresas, getEmpresa, addEmpresa, 
  updateEmpresa, deleteEmpresa, getEmpresaDataByUser, updateEmpresaMonedas };