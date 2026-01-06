import { getRolesRequest, getRolRequest, addRolRequest, updateRolRequest, deleteRolRequest }
  from '@/api/api.rol';

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
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error en addRol:", error);
  }
};


const updateRol = async (id, newFields) => {
  try {
    const response = await updateRolRequest(id, newFields);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    // Error logic
  }
};

const deleteRol = async (id) => {
  try {
    const response = await deleteRolRequest(id);
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

export { getRoles, getRol, addRol, updateRol, deleteRol };