import { useState, useEffect } from 'react';
import axios from "@/api/axios";

const useVendedoresData = () => {
    const [vendedores, setVendedores] = useState([]);

    useEffect(() => {
        const fetchVendedores = async () => {
            try {
                // Hacer la solicitud al endpoint que obtiene los vendedores
                const response = await axios.get('/sucursales/vendedores');
                
                if (response.data.code === 1) {
                    // Mapear los datos para adaptarlos a la estructura esperada
                    const vendedores = response.data.data.map(item => ({
                        dni: item.dni, // DNI del vendedor
                        nombre: item.nombre_completo, // Nombre completo del vendedor
                    }));
                    setVendedores(vendedores); // Guardar la lista de vendedores en el estado
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };

        fetchVendedores();
    }, []);

    return { vendedores, setVendedores };
};

export default useVendedoresData;