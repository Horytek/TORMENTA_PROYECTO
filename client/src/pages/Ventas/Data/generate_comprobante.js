import axios from 'axios';

const generateComprobanteNumber = async (id_comprobante) => {
  try {
    // Hacer la solicitud GET
    const response = await axios.get(`http://localhost:4000/api/ventas/numero_comprobante?id_comprobante=${id_comprobante}`);

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
