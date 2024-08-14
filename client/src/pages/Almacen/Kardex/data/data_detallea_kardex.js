import axios from 'axios';

const getDetalleKardexData = async (filters) => {
  try {
    const response = await axios.get('http://localhost:4000/api/kardex/detalleKA', {
      params: filters,
    });

    if (response.data.code === 1) {
      return { kardex: response.data.data };
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return { kardex: [] };
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { kardex: [] };
  }
};

export default getDetalleKardexData;
