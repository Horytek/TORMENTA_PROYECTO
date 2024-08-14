import axios from 'axios';

const getProductoData = async (filters) => {
  try {
    const response = await axios.get('http://localhost:4000/api/kardex/producto', {
      params: filters,
    });

    if (response.data.code === 1) {
      return { productos: response.data.data };
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return { productos: [] };
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { productos: [] };
  }
};

export default getProductoData;
