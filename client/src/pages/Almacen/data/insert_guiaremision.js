import axios from 'axios';

const insertGuiaRemisionAndDetalle = async (data) => {
  const {
    id_sucursal, id_ubigeo_o,id_ubigeo_d, id_destinatario, id_transportista, glosa, dir_partida, dir_destino, observacion, f_generacion, h_generacion, producto, num_comprobante, cantidad,
  } = data;

  try {
    const response = await axios.post('http://localhost:4000/api/guia_remision/nuevaguia', {
      id_sucursal,
      id_ubigeo_o,
      id_ubigeo_d,
      id_destinatario,
      id_transportista,
      glosa,
      dir_partida,
      dir_destino,
      observacion,
      f_generacion,
      h_generacion,
      producto,
      num_comprobante,
      cantidad
    });

    if (response.data.code === 1) {
      console.log('Guía de remisión y detalles insertados correctamente');
      return { success: true, message: 'Guía de remisión y detalles insertados correctamente' };
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { success: false, message: error.message };
  }
};

export default insertGuiaRemisionAndDetalle;
