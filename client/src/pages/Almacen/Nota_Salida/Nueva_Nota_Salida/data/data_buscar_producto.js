import axios from 'axios';

const useProductosData = async (filters) => {
  try {
    const response = await axios.get('http://localhost:4000/api/nota_salida/productos', {
      params: filters,
    });

    console.log('Respuesta del servidor:', response);

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

export default useProductosData;
