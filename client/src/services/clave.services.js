import { getClavesRequest, getClaveRequest, getClaveByEmpresaAndTipoRequest, addClaveRequest, updateClaveRequest, deleteClaveRequest }
  from '@/api/api.clave';
import { getUsuario_1 } from "@/services/usuario.services";

import { useUserStore } from "@/store/useStore";

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

const getClaveByEmpresaAndTipo = async (id) => {
  try {
    const response = await getClaveByEmpresaAndTipoRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return null;
    }
  } catch (error) {
    if (error?.response?.status === 404) return null;
    console.error('Error en la solicitud: ', error.message);
    return null;
  }
};

const addClave = async (producto) => {
  try {
    const response = await addClaveRequest(producto);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const updateClave = async (id, newFields) => {
  try {
    const response = await updateClaveRequest(id, newFields);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    // Error logic
  }
};

const deleteClave = async (id) => {
  try {
    const response = await deleteClaveRequest(id);
    if (response.data.code === 2) {
      // Success
    }
    if (response.data.code === 1) {
      // Success
    }
    if (response.status === 404) {
      // Error
    }
  } catch (error) {
    // Error
  }
};

const getClaveSunatByUser = async (nombre) => {
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

    const claveData = await getClaveByEmpresaAndTipo(id_empresa);

    if (!claveData || !claveData.valor) {
      throw new Error("No se encontró la clave para el tipo 'Sunat'.");
    }

    return claveData.valor;
  } catch (error) {
    console.error("Error al obtener la clave de Sunat:", error.message);
    throw error;
  }
};

export { getClaves, getClave, addClave, updateClave, deleteClave, getClaveSunatByUser };