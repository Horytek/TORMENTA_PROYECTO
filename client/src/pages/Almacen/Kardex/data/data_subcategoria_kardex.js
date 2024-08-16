import { useState, useEffect } from 'react';
import axios from 'axios';

const useSubCategoriaData = (cat) => {
    const [subcategorias, setSubCategorias] = useState([]);

    useEffect(() => {
        const fetchSubCategorias = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/kardex/subcategoria', {
                    params: { cat }
                });
                
                if (response.data.code === 1) {
                    const subcategorias = response.data.data.map(item => ({
                        id: item.id,
                        sub_categoria: item.sub_categoria,
                    }));
                    setSubCategorias(subcategorias);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };

        fetchSubCategorias();
    }, [cat]);

    return { subcategorias, setSubCategorias };
};

export default useSubCategoriaData;
