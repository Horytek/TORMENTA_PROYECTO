import axios from 'axios';

const addVehiculo = async (data) => {
    const { placa, tipo } = data;

    try {
        const response = await axios.post('http://localhost:4000/api/nuevo_vehiculo', {
            placa,
            tipo,
        });

        if (response.data.code === 1) {
            console.log('Vehículo añadido exitosamente');
            return { success: true, message: 'Vehículo añadido exitosamente' };
        } else {
            console.error('Error en la solicitud: ', response.data.message);
            return { success: false, message: response.data.message };
        }
    } catch (error) {
        console.error('Error en la solicitud: ', error.message);
        return { success: false, message: error.message };
    }
};

export default addVehiculo;
