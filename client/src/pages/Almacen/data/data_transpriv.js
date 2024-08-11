import { useState, useEffect } from 'react';
import axios from 'axios';

const useTransPrivData = () => {
  const [transprivados, setTransprivados] = useState([]);

  useEffect(() => {
    const fetchTransPriv = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/guia_remision/transprivado');
        
        if (response.data.code === 1) {
          const transportes = response.data.data.map(item => ({
            id: item.id,
            placa: item.placa || null, // Maneja la placa como nula si no se proporciona
            dni: item.dni,
            transportista: item.transportista,
            telefonopriv: item.telefonopriv,
            vehiculopriv: item.vehiculopriv,
          }));
          setTransprivados(transportes);
          console.log('Transportes Privados:', transportes);  // Log para verificar los datos
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchTransPriv();
  }, []);

  return { transprivados };
};

export default useTransPrivData;
