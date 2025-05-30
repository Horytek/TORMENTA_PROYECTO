import { useState, useEffect } from 'react';
import axios from "@/api/axios";

const useDocumentoData = () => {
    const [documentos, setDocumentos] = useState([]);

    // Nueva función para obtener el siguiente número de nota de ingreso bajo demanda
    const getNuevoNumeroNotaIngreso = async () => {
        try {
            const response = await axios.get('/nota_ingreso/ndocumento');
            if (response.data.code === 1) {
                return response.data.data[0]?.nuevo_numero_de_nota || "-";
            }
            return "-";
        } catch (error) {
            console.error('Error en la solicitud: ', error.message);
            return "-";
        }
    };

    useEffect(() => {
        const fetchDocumentos = async () => {
            try {
                const response = await axios.get('/nota_ingreso/ndocumento');
                
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

    return { documentos, setDocumentos, getNuevoNumeroNotaIngreso };
};

export default useDocumentoData;