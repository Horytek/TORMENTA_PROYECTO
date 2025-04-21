import { getClavesRequest, getClaveRequest, addClaveRequest, updateClaveRequest, deleteClaveRequest } 
from '@/api/api.clave';
import { getUsuario } from "@/services/usuario.services";
import { toast } from "react-hot-toast";

const getClaves = async () => {
  try {
    const response = await getClavesRequest();
    if (response.data.code === 1) {
      return response.data.data; 
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const getClave = async (id) => {
  try {
    const response = await getClaveRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const addClave = async (producto) => {
  try {
    const response = await addClaveRequest(producto);
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

const updateClave = async (id, newFields) => {
  try {
    const response = await updateClaveRequest(id, newFields);
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

const deleteClave = async (id) => {
  try {
    const response = await deleteClaveRequest(id);
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

const getClaveSunatByUser = async () => {
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

      // Obtener la clave relacionada con el tipo "Sunat"
      const claveData = await getClave({ id_empresa, tipo: "Sunat" });
      if (!claveData) {
          throw new Error("No se encontró la clave para el tipo 'Sunat'.");
      }

      return claveData.valor; // Retornar solo el valor de la clave
  } catch (error) {
      console.error("Error al obtener la clave de Sunat:", error.message);
      throw error;
  }
};

export { getClaves, getClave, addClave, updateClave, deleteClave, getClaveSunatByUser };