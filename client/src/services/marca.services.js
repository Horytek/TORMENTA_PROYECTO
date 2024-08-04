import { getMarcasRequest, addMarcasRequest } 
from '@/api/api.marca';
import { toast } from "react-hot-toast";

const getMarcas = async () => {
    try {
      const response = await getMarcasRequest();
      if (response.data.code === 1) {
        return response.data.data;
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
};

const addMarca = async (marca) => {
    try {
      const response = await addMarcasRequest(marca);
      if (response.data.code === 1) {
        toast.success("Marca añadido con éxito");
        return [true, response.data.id];
      } else {
        toast.error("Ocurrió un error al guardar la marca");
        return [false];
      }
    } catch (error) {
      toast.error("Error en el servidor interno");
    }
};

export { getMarcas, addMarca };

