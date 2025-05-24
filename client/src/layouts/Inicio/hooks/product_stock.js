import axios from "@/api/axios";

// Obtiene productos con menor stock (stock crítico) usando el endpoint /kardex/stock_inicio
const getProductosMenorStock = async (filters) => {
  try {
    const response = await axios.get('/kardex/stock_inicio', {
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

export default getProductosMenorStock;