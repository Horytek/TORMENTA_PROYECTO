import { getRolesRequest, getRolRequest, addRolRequest, updateRolRequest, deleteRolRequest } 
from '@/api/api.rol';
import { toast } from "react-hot-toast";
import { transformData } from '@/utils/rol';

const getRoles = async () => {
  try {
    const response = await getRolesRequest();
    if (response.data.code === 1) {
      return transformData(response.data.data);
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const getRol = async (id) => {
  try {
    const response = await getRolRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const addRol = async (user) => {
  try {
    const response = await addRolRequest(user);
    //console.log("Respuesta del servidor (addRol):", response.data);
    if (response.data.code === 1) {
      toast.success("Rol añadido con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al guardar el rol");
      return false;
    }
  } catch (error) {
    console.error("Error en addRol:", error);
    toast.error("Error en el servidor interno");
  }
};


const updateRol = async (id, newFields) => {
  try {
    const response = await updateRolRequest(id, newFields);
    if (response.data.code === 1) {
      toast.success("Rol actualizado con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al actualizar el rol");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const deleteRol = async (id) => {
  try {
    const response = await deleteRolRequest(id);
    if (response.data.code === 2) {
      toast.success("Rol dado de baja con éxito");
    }
    if (response.data.code === 1) {
      toast.success("Rol eliminado con éxito");
    }
    if (response.status === 404) {
      toast.error("Ocurrió un error al eliminar el rol");
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

export { getRoles, getRol, addRol, updateRol, deleteRol };