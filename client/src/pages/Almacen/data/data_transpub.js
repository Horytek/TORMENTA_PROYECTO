import { useState, useEffect } from 'react';
import axios from 'axios';

const useDocumentoData = () => {
    const [transportes, setTransportes] = useState([]);

    useEffect(() => {
        const fetchTrasnPub = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/guia_remision/transpublico');
                
                if (response.data.code === 1) {
                    const transportes = response.data.data.map(item => ({
                        id: item.id,
                        placa: item.placa,
                        ruc: item.ruc,
                        razonsocial: item.razonsocial,
                        telefono: item.telefono,
                    }));
                    setTransportes(transportes);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };

        fetchTrasnPub();
    }, []);

    return { transportes, setTransportes };
};

export default useDocumentoData;
