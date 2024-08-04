import { useState, useEffect } from 'react';
import axios from 'axios';

const useDestinatarioData = () => {
    const [destinatarios, setDestinatarios] = useState([]);

    useEffect(() => {
        const fetchDestinatarios = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/nota_salida/destinatario');
                
                if (response.data.code === 1) {
                    const destinatarios = response.data.data.map(item => ({
                        id: item.id,
                        documento: item.documento,
                        destinatario: item.destinatario,

                    }));
                    setDestinatarios(destinatarios);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };

        fetchDestinatarios();
    }, []);

    return { destinatarios, setDestinatarios };
};

export default useDestinatarioData;
