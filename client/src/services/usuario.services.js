import { getUsuariosRequest, getUsuarioRequest, addUsuarioRequest, updateUsuarioRequest, deleteUsuarioRequest } 
from '@/api/api.usuario';
import { toast } from "react-hot-toast";
import { transformData } from '@/utils/usuario';

const getUsuarios = async () => {
  try {
    const response = await getUsuariosRequest();
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

const addUsuario= async (user) => {
  try {
    const response = await addUsuarioRequest(user);
    console.log(user)
    if (response.data.code === 1) {
      toast.success("Usuario añadido con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al guardar el usuario");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const updateUsuario = async (id, newFields) => {
  try {
    const response = await updateUsuarioRequest(id, newFields);
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

export { getUsuarios, getUsuario, addUsuario, updateUsuario, deleteUsuario };