import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useVentasData = () => {
  const [totalRecaudado, setTotalRecaudado] = useState(0);

  const fetchVentas = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/ventas', {
        params: {
          limit: 100000000 
        }
      });
  
      if (response.data.code === 1) {
        const allVentas = response.data.data;
  
        const totalRecaudado = allVentas.reduce((total, venta) => {
          const subtotalVenta = venta.detalles.reduce((subtotal, detalle) => {
            return subtotal + parseFloat(detalle.subtotal.replace('S/ ', ''));
          }, 0);
          return total + subtotalVenta;
        }, 0).toFixed(2);
  
        setTotalRecaudado(totalRecaudado);
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
  }, []);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  return { totalRecaudado };
};

export default useVentasData;
