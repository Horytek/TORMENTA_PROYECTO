//import axios from 'axios';
//import {toast} from "react-hot-toast";
import axios from "@/api/axios";
import {
    updateVentaEstadoRequest,
} from "@/api/api.ventas";

// Maneja la solicitud de cobro
export const handleUpdate = async (datosVenta) => {
    try {
        if (!datosVenta || !datosVenta.id) return;

        const response = await updateVentaEstadoRequest({
            id_venta: datosVenta.id
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