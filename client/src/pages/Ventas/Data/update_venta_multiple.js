//import axios from 'axios';
import axios from "../../../api/axios";
// Maneja la solicitud de actualización para múltiples ventas
export const handleUpdateMultiple = async (ventas) => {
    try {
        // Crear un arreglo de promesas para todas las solicitudes de actualización
        const updatePromises = ventas.map(venta => 
            axios.post('/ventas/actualizar_venta', {
                id_venta: venta.id
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        );

        // Ejecutar todas las promesas en paralelo
        const responses = await Promise.all(updatePromises);

        // Verificar las respuestas y manejar los resultados
        responses.forEach((response, index) => {
            if (response.status === 200) {
                console.log(`Venta ${ventas[index].id} actualizada correctamente`);
            } else {
                console.error(`Error al actualizar la venta ${ventas[index].id}:`, response.data);
            }
        });
    } catch (error) {
        console.error('Error de red:', error);
    }
};
