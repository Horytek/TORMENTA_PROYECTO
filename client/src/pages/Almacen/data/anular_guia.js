import axios from "@/api/axios";

const anularGuia = async (guiaId) => {
  const usuario = localStorage.getItem('usuario'); // Obtiene el usuario actual

  try {
    const response = await axios.post('/guia_remision/anularguia', {
      guiaId,
      usuario, // Envía el usuario al backend
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