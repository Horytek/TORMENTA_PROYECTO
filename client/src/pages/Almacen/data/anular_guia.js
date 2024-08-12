import axios from 'axios';

const anularGuia = async (guiaId) => {
  try {
    const response = await axios.post('http://localhost:4000/api/guia_remision/anularguia', {
      guiaId,
    });
    if (response.data.code === 1) {
      console.log('Guía de remisión anulada correctamente');
      return { success: true, message: 'Guía de remisión anulada correctamente' };
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { success: false, message: error.message };
  }
};

export default anularGuia;
