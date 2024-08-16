import { useState, useEffect } from 'react';
import axios from 'axios';

const useMarcaData = () => {
    const [marcas, setMarcas] = useState([]);

    useEffect(() => {
        const fetchMarcas = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/kardex/marca');
                
                if (response.data.code === 1) {
                    const marcas = response.data.data.map(item => ({
                        id: item.id,
                        marca: item.marca,
                    }));
                    setMarcas(marcas);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };

        fetchMarcas();
    }, []);

    return { marcas, setMarcas };
};

export default useMarcaData;
