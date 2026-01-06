import {
  getUsuariosRequest,
  deleteUsuarioRequest,
  getUsuarioRequest,
  getUsuarioRequest_1,
  addUsuarioRequest,
  addUsuarioLandingRequest,
  updateUsuarioRequest,
  updateUsuarioPlanRequest,
  bulkUpdateUsuariosRequest,
  importUsuariosRequest,
  exportUsuariosRequest
} from "../api/api.usuario";

import { transformData } from '@/utils/usuario';

const getUsuarios = async () => {
  try {
    // Elimina el límite para traer todos los usuarios
    const response = await getUsuariosRequest({ sortDir: 'asc' });
    if (response.data.code === 1) {
      return transformData(response.data.data);
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const getUsuario = async (id) => {
  try {
    const response = await getUsuarioRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const getUsuario_1 = async (id) => {
  try {
    const response = await getUsuarioRequest_1(id);
    if (response.data.code === 1) {
      return response.data.data; // Esto debería ser un array
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const addUsuario = async (user) => {
  try {
    const response = await addUsuarioRequest(user);
    if (response.data.code === 1) {
      return true;
    } else {
      console.error('Error adding user:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('Error in addUsuario service:', error);
    console.log('Error response data:', error.response?.data);
    return false;
  }
};

const updateUsuario = async (id, newFields) => {
  try {
    const response = await updateUsuarioRequest(id, newFields);
    if (response.data.code === 1) {
      //toast.success("Usuario actualizado con éxito");
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const updateUsuarioPlan = async (id, newFields) => {
  try {
    const response = await updateUsuarioPlanRequest(id, newFields);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const deleteUsuario = async (id) => {
  try {
    const response = await deleteUsuarioRequest(id);
    if (response.data.code === 2) {
      // Log success?
    }
    if (response.data.code === 1) {
      // Log success?
    }
    if (response.status === 404) {
      // Log error?
    }
  } catch (error) {
    // Log error?
  }
};

const addUsuarioLanding = async (user) => {
  try {
    const response = await addUsuarioLandingRequest(user);
    if (response.data.code === 1) {
      return true;
    } else {
      console.error('Error adding user (landing):', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('Error in addUsuarioLanding service:', error);
    return false;
  }
};

const bulkUpdateUsuarios = async (action, ids) => {
  try {
    const response = await bulkUpdateUsuariosRequest({ action, ids });
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error in bulkUpdateUsuarios service:', error);
    return false;
  }
};

export const importUsuarios = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await importUsuariosRequest(formData);
    if (response.data.code === 1) {
      return { success: true, details: response.data.details };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || "Error al importar usuarios";
    const details = error.response?.data?.details;
    return { success: false, message, details };
  }
};

export const exportUsuarios = async (filters = {}) => {
  try {
    const response = await exportUsuariosRequest(filters);

    // Crear blob y descargar
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error export:", error);
    return false;
  }
};

export const toggleEstadoUsuario = async (id_usuario, nuevoEstado) => {
  try {
    const body = { estado_usuario: nuevoEstado };
    const response = await updateUsuarioRequest(id_usuario, body);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};

export { getUsuarios, getUsuario, addUsuario, addUsuarioLanding, updateUsuario, deleteUsuario, updateUsuarioPlan, getUsuario_1, bulkUpdateUsuarios };
