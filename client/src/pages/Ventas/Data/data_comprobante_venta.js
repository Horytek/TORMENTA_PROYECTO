import { useState, useEffect } from 'react';
//import axios from 'axios';
import axios from "../../../api/axios";

const useComprobanteData = () => {
  const [comprobantes, setComprobante] = useState([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await axios.get('/ventas/comprobante');
        
        if (response.data.code === 1) {
          const comprobantes = response.data.data.map(item => ({
            id: item.id,
            nombre: item.nombre,
          }));
          setComprobante(comprobantes);
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchProductos();
  }, []);

  return {comprobantes, setComprobante};
};

export default useComprobanteData;
