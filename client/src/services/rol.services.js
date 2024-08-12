import { getRolesRequest } 
from '@/api/api.rol';

const getRoles = async () => {
  try {
    const response = await getRolesRequest();
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

export { getRoles };