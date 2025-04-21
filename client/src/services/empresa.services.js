import { getEmpresasRequest, getEmpresaRequest, addEmpresaRequest, updateEmpresaRequest, deleteEmpresaRequest } 
from '@/api/api.empresa';
import { getUsuario } from "@/services/usuario.services";
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

const getEmpresaDataByUser = async () => {
  try {
    // Obtener el nombre del usuario desde localStorage
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
      throw new Error("No se encontró el usuario en localStorage.");
    }

    // Obtener los datos del usuario desde la API
    const usuarioData = await getUsuario(usuario);
    if (!usuarioData || !usuarioData.id_empresa) {
      throw new Error("No se encontró el id_empresa para el usuario actual.");
    }

    const id_empresa = usuarioData.id_empresa;

    // Obtener los datos de la empresa desde la API
    const empresaData = await getEmpresa(id_empresa);
    if (!empresaData) {
      throw new Error("No se encontraron datos para la empresa.");
    }

    return empresaData;
  } catch (error) {
    console.error("Error al obtener los datos de la empresa:", error.message);
    throw error;
  }
};

export { getEmpresas, getEmpresa, addEmpresa, updateEmpresa, deleteEmpresa, getEmpresaDataByUser };