import axios from 'axios';

const getIngresosData = async (filters) => {
  try {
    const response = await axios.get('http://localhost:4000/api/nota_ingreso', {
      params: filters,
    });

    if (response.data.code === 1) {
      return { ingresos: response.data.data };
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return { ingresos: [] };
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { ingresos: [] };
  }
};

export default getIngresosData;
