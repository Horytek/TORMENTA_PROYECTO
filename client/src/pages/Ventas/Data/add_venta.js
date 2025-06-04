//import axios from 'axios';
import axios from "../../../api/axios";
import { handleSunatUnique } from "../Data/add_sunat_unique";
import {  handleUpdate } from '../Data/update_venta';
// Valida el formato decimal
export const validateDecimalInput = (e) => {
    const { value } = e.target;
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', '.', ...Array.from(Array(10).keys()).map(String)];
    if (!allowedKeys.includes(e.key)) {
        e.preventDefault();
    }
    if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1].length >= 2 && e.key !== 'Backspace') {
            e.preventDefault();
        }
    }
};

// Maneja la solicitud de cobro
export const handleCobrar = async (datosVenta, setShowConfirmacion,datosVenta_1,ven) => {
    try {
        /*console.log('Datos de venta:', datosVenta);
        console.log('Datos de venta_1:', datosVenta_1);
        console.log('Datos de ven:', ven);*/
        const response = await axios.post('/ventas/agregar_venta', datosVenta, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if(datosVenta_1.comprobante_pago != "Nota de venta"){
            handleSunatUnique(datosVenta_1);
            handleUpdate(ven);
        }
        
        if (response.status === 200) {
            setShowConfirmacion(true);
        } else {
            console.error('Error al registrar la venta:', response.data);
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
};
