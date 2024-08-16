//import axios from 'axios';
import axios from "../../../api/axios";

export const  handleGuardarCliente = async (datosCliente,setShowNuevoCliente) => {

    try {
        console.log('Datos del cliente:', datosCliente);
        const response = await axios.post('/ventas/cliente', datosCliente, {// Reemplaza con la URL de tu API
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.status === 200) {
            setShowNuevoCliente(false); // Cierra el modal de nuevo cliente
        } else {
            console.error('Error al registrar eñ cliente:', response.data);
        }
    } catch (error) {
        console.error('Error al guardar el cliente:', error);
        alert('Hubo un error al guardar el cliente');
    }
};