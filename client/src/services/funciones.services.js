import { getFuncionesRequest, getFuncionRequest, addFuncionRequest, updateFuncionRequest, /*deleteFuncionRequest*/ }
  from '@/api/api.funciones';


const getFunciones = async () => {
  try {
    const response = await getFuncionesRequest();
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const getFuncion = async (id) => {
  try {
    const response = await getFuncionRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const addFuncion = async (user) => {
  try {
    const response = await addFuncionRequest(user);
    //console.log("Respuesta del servidor (addRol):", response.data);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error en addRol:", error);
  }
};


const updateFuncion = async (id, newFields) => {
  try {
    const response = await updateFuncionRequest(id, newFields);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    // Error logic
  }
};

/*const deleteRol = async (id) => {
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
};*/

export { getFunciones, getFuncion, addFuncion, updateFuncion, /*deleteRol*/ };