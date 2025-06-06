// anular_nota_ingreso.js (sin hooks aquí)
import axios from "@/api/axios";

const anularNota = async (notaId, usuario) => {
  try {
    const response = await axios.post('/nota_ingreso/anular', {
      notaId,
      usuario,
    });
    if (response.data.code === 1) {
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

export default anularNota;
