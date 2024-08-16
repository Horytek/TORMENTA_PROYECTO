import axios from 'axios';

const insertDestinatario = async (data) => {
  try {
    const response = await axios.post('http://localhost:4000/api/destinatario/nuevodestinatario', data);
    if (response.data.code === 1) {
      console.log('Destinatario insertado correctamente');
      return { success: true, message: 'Destinatario insertado correctamente' };
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { success: false, message: error.message };
  }
};

export default insertDestinatario;
