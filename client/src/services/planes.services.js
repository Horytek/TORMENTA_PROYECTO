import { getPlanesRequest  } 
from '@/api/api.planes';
import { toast } from "react-hot-toast";

const getPlanes = async () => {
  try {
    const response = await getPlanesRequest();
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

export {getPlanes};