import { useState, useEffect } from 'react';
import axios from 'axios';

const useTransPubData = () => {
  const [transpublicos, setTranspublicos] = useState([]);

  useEffect(() => {
    const fetchTransPub = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/guia_remision/transpublico');
        
        if (response.data.code === 1) {
          const transportes = response.data.data.map(item => ({
            id: item.id,
            placa: item.placa || null, // Maneja la placa como nula si no se proporciona
            ruc: item.ruc,
            razonsocial: item.razonsocial,
            telefonopub: item.telefonopub,
            vehiculopub: item.vehiculopub,
          }));
          setTranspublicos(transportes);
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchTransPub();
  }, []);

  return { transpublicos, setTranspublicos };
};

export default useTransPubData;
