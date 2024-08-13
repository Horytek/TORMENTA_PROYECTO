import axios from 'axios';

const insertNotaAndDetalle = async (data) => {
  try {
    const response = await axios.post('http://localhost:4000/api/nota_salida/nuevanota', data);
    if (response.data.code === 1) {
      console.log('Nota y detalle insertados correctamente');
      return { success: true, message: 'Nota y detalle insertados correctamente' };
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { success: false, message: error.message };
  }
};

export default insertNotaAndDetalle;
