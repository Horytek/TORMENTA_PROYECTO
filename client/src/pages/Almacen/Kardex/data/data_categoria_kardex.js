import { useState, useEffect } from 'react';
import axios from "@/api/axios";


const useCategoriaData = () => {
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        const fetchMarcas = async () => {
            try {
                const response = await axios.get('/kardex/categoria');
                
                if (response.data.code === 1) {
                    const categorias = response.data.data.map(item => ({
                        id: item.id,
                        categoria: item.categoria,
                    }));
                    setCategorias(categorias);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };

        fetchMarcas();
    }, []);

    return { categorias, setCategorias };
};

export default useCategoriaData;
