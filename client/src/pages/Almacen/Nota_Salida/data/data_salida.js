import axios from 'axios';

const getSalidaData = async (filters) => {
  try {
    const response = await axios.get('http://localhost:4000/api/nota_salida', {
      params: filters,
    });

    if (response.data.code === 1) {
      return { salida: response.data.data };
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return { salida: [] };
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { salida: [] };
  }
};

export default getSalidaData;
