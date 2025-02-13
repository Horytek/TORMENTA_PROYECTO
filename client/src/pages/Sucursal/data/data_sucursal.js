import axios from "@/api/axios";

const getSucursalData = async ( filters ) => {
  try {

    const response = await axios.get('/sucursales/', {
      params: filters,
    });

    if (response.data.code === 1) {
        return { sucursales: response.data.data };
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return { sucursales: [] }; 
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { sucursales: [] }; 
  }
};

export default getSucursalData;