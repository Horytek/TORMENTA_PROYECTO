import axios from "@/api/axios";

const insertSucursal = async (data) => {
  try {
    const response = await axios.post('/sucursales/addsucursal', data);
    if (response.data.code === 1) {
      console.log('Sucursal insertada correctamente');
      return { success: true, message: 'Sucursal insertada correctamente' };
    } else {
      console.error('Error en la solicitud: ', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
    return { success: false, message: error.message };
  }
};

export default insertSucursal;