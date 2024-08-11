import axios from 'axios';

export const addDestinatarioJuridico = async (data, setShowModal) => {
    try {
        console.log('Datos del destinatario jurídico:', data);
        const response = await axios.post('http://localhost:4000/api/guia_remision/destjuridico', data, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.data.code === 1) {
            console.log('Destinatario jurídico añadido exitosamente');
            setShowModal(false); // Cierra el modal
            return { success: true, message: 'Destinatario jurídico añadido exitosamente' };
        } else {
            console.error('Error en la solicitud: ', response.data.message);
            return { success: false, message: response.data.message };
        }
    } catch (error) {
        console.error('Error en la solicitud: ', error.message);
        return { success: false, message: error.message };
    }
};

export default addDestinatarioJuridico;
