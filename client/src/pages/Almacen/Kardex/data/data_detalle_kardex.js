import axios from 'axios';

const getAllKardexData = async (filters) => {
  try {
    // Fetch current transactions data
    const responseKardex = await axios.get('http://localhost:4000/api/kardex/detalleK', {
      params: filters,
    });

    // Fetch previous transactions data
    const responsePrev = await axios.get('http://localhost:4000/api/kardex/detalleKA', {
      params: {
        fecha: filters.fechaInicio,  // Use fechaInicio as the cutoff date
        idProducto: filters.idProducto,
        idAlmacen: filters.idAlmacen,
      },
    });

    // Fetch product data
    const responseProducto = await axios.get('http://localhost:4000/api/kardex/producto', {
      params: filters,
    });

    // Check for successful responses
    if (responseKardex.data.code === 1 && responsePrev.data.code === 1 && responseProducto.data.code === 1) {
      return { 
        kardex: responseKardex.data.data, 
        previousTransactions: responsePrev.data.data,
        productos: responseProducto.data.data
      };
    } else {
      console.error('Error en la solicitud: ', responseKardex.data.message || responsePrev.data.message || responseProducto.data.message);
      return { kardex: [], previousTransactions: null, productos: [] };
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { kardex: [], previousTransactions: null, productos: [] };
  }
};

export default getAllKardexData;
