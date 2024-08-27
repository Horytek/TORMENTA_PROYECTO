import { useState, useEffect } from 'react';
//import axios from 'axios';
import axios from "../../../api/axios";
export const useLastData = () => {
  const [last, setLast] = useState([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await axios.get('/ventas/last_venta');
        
        if (response.data.code === 1) {
          const ultimos = response.data.data.map(item => ({
            id: item.id,
          }));
          setLast(ultimos);
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchProductos();
  }, []);

  return {last, setLast};
};
