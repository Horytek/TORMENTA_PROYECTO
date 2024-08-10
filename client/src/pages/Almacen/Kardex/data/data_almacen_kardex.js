import { useState, useEffect } from 'react';
import axios from 'axios';

const useAlmacenData = () => {
    const [almacenes, setAlmacenes] = useState([]);

    useEffect(() => {
        const fetchAlmacenes = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/kardex/almacen');
                
                if (response.data.code === 1) {
                    const almacenes = response.data.data.map(item => ({
                        id: item.id,
                        almacen: item.almacen,
                        sucursal: item.sucursal,
                    }));
                    setAlmacenes(almacenes);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };

        fetchAlmacenes();
    }, []);

    return { almacenes, setAlmacenes };
};

export default useAlmacenData;
