//import axios from 'axios';
import axios from "../../../api/axios";
const generateComprobanteNumber = async (id_comprobante) => {
  try {
    // Hacer la solicitud GET
    const response = await axios.get('/ventas/numero_comprobante', {
          params: { id_comprobante, usuario: localStorage.getItem('usuario') }
        });
    // Suponiendo que la respuesta es un objeto con un campo 'nuevoNumComprobante'
    const nuevoNumComprobante = response.data.nuevoNumComprobante;

    // Verifica si 'nuevoNumComprobante' es una lista o un solo valor
    if (Array.isArray(nuevoNumComprobante)) {
      // Si es una lista, toma el primer elemento (o maneja la lista según sea necesario)
      return nuevoNumComprobante[0];
    }

    // Si es un solo valor, simplemente retorna el valor
    return nuevoNumComprobante;

  } catch (error) {
    console.error('Error al generar el número de comprobante:', error);
    throw error;
  }
};

export default generateComprobanteNumber;
