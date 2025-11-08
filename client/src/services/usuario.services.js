import { getUsuariosRequest, getUsuarioRequest, getUsuarioRequest_1, addUsuarioRequest, addUsuarioLandingRequest, updateUsuarioRequest, updateUsuarioPlanRequest, deleteUsuarioRequest } 
from '@/api/api.usuario';
import { toast } from "react-hot-toast";
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

const addUsuario= async (user) => {
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
    if (error.response?.status === 400) {
      toast.error(`Datos incompletos: ${error.response?.data?.message || 'Verifique los campos requeridos'}`);
    } else {
      toast.error("Error en el servidor interno");
    }
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
      toast.error("Ocurrió un error al actualizar el usuario");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const updateUsuarioPlan = async (id, newFields) => {
  try {
    const response = await updateUsuarioPlanRequest(id, newFields);
    if (response.data.code === 1) {
      toast.success("Usuario actualizado con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al actualizar el usuario");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const deleteUsuario = async (id) => {
  try {
    const response = await deleteUsuarioRequest(id);
    if (response.data.code === 2) {
      toast.success("Usuario dado de baja con éxito");
    }
    if (response.data.code === 1) {
      toast.success("Usuario eliminado con éxito");
    }
    if (response.status === 404) {
      toast.error("Ocurrió un error al eliminar el usuario");
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
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
    if (error.response?.status === 400) {
      toast.error(`Datos incompletos: ${error.response?.data?.message || 'Verifique los campos requeridos'}`);
    } else {
      toast.error("Error en el servidor interno");
    }
    return false;
  }
};


export { getUsuarios, getUsuario, addUsuario, addUsuarioLanding, updateUsuario, deleteUsuario, updateUsuarioPlan, getUsuario_1 };
