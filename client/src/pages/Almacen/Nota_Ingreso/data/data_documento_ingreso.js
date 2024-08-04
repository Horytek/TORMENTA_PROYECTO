import { useState, useEffect } from 'react';
import axios from 'axios';

const useDocumentoData = () => {
    const [documentos, setDocumentos] = useState([]);

    useEffect(() => {
        const fetchDocumentos = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/nota_ingreso/ndocumento');
                
                if (response.data.code === 1) {
                    const documentos = response.data.data.map(item => ({
                        nota: item.nuevo_numero_de_nota,

                    }));
                    setDocumentos(documentos);
                } else {
                    console.error('Error en la solicitud: ', response.data.message);
                }
            } catch (error) {
                console.error('Error en la solicitud: ', error.message);
            }
        };

        fetchDocumentos();
    }, []);

    return { documentos, setDocumentos };
};

export default useDocumentoData;
