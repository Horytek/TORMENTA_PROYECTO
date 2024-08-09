import { useState, useEffect } from 'react';
import axios from 'axios';

const useCodigoData = () => {
    const [codigos, setCodigos] = useState([]);

    useEffect(() => {
        const fetchCodigos = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/guia_remision/cod_transporte');
                if (response.data.code === 1) {
                    const codigos = response.data.data.map(item => ({
                        codtrans: item.nuevo_codigo_trans,
                    }));
                    setCodigos(codigos);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };

        fetchCodigos();
    }, []);

    return { codigos, setCodigos };
};

export default useCodigoData;
