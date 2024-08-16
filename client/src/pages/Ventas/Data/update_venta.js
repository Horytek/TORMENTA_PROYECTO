//import axios from 'axios';
//import {toast} from "react-hot-toast";
import axios from "../../../api/axios";

// Maneja la solicitud de cobro
export const handleUpdate = async (datosVenta) => {
    try {
        console.log('Datos de venta:', datosVenta);
        const response = await axios.post('/ventas/actualizar_venta', {
            id_venta: datosVenta.id
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

        if (response.status === 200) {
            //toast.success('Venta eliminada correctamente');
        } else {
            console.error('Error al registrar la venta:', response.data);
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
};