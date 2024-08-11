import { useState, useEffect } from 'react';
import axios from 'axios';

const useClientesData = () => {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/guia_remision/clienteguia');
        
        if (response.data.code === 1) {
          const clientes = response.data.data.map(item => ({
            id:item.id,
            nombre: item.destinatario,
            documento: item.documento,
            ubicacion: item.ubicacion,
          }));
          setClientes(clientes);
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchClientes();
  }, []);

  return {clientes, setClientes};
};

export default useClientesData;
