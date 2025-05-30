import axios from "@/api/axios";

const anularNotaSalida = async (notaId) => {
  const usuario = localStorage.getItem('usuario'); // Obtiene el usuario actual

  try {
    const response = await axios.post('/nota_salida/anular', {
      notaId,
      usuario, // Envía el usuario
    });
    if (response.data.code === 1) {
      //console.log('Nota y detalle anulados correctamente');
      return { success: true, message: 'Nota y detalle anulados correctamente' };
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { success: false, message: error.message };
  }
};

export default anularNotaSalida;