import axios from 'axios';

const getProductosRequest = async () => {
  try {
    const response = await axios.get('http://localhost:4000/api/productos');
    
    if (response.data.code === 1) {
      const productos = response.data.data.map(item => ({
        descripcion: item.descripcion,
        nom_subcat: item.nom_subcat,
        nom_marca: item.nom_marca,
        undm: item.undm,
        precio: parseFloat(item.precio), // Convertir el precio a número flotante
        cod_barras: item.cod_barras || '-', // Manejar el caso donde cod_barras pueda ser null
        estado: item.estado === 1 ? 'Inactivo' : 'Activo' // Convertir estado a texto según convención de productosData
      }));
      
      return productos; // Devuelve el array de productos transformados
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      throw new Error('Error en la solicitud HTTP');
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    throw error;
  }
};

export default getProductosRequest;