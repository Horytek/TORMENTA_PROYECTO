//import axios from 'axios';
import axios from "../../../api/axios";
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
export const handleCobrar = async (datosVenta, setShowConfirmacion) => {
    try {
        console.log('Datos de venta:', datosVenta);
        const response = await axios.post('/ventas/agregar_venta', datosVenta, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.status === 200) {
            setShowConfirmacion(true);
        } else {
            console.error('Error al registrar la venta:', response.data);
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
};
