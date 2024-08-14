import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useTotalProductosVendidos = (idSucursal) => { 
  const [totalProductosVendidos, setTotalProductosVendidos] = useState(0);

  const fetchProductos = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/reporte/productos_vendidos', {
        params: {
          id_sucursal: idSucursal,
        },
      });

      if (response.status === 200) {
        const total = parseInt(response.data.totalProductosVendidos || 0, 10); 
        setTotalProductosVendidos(total);
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
  }, [idSucursal]); 

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  return { totalProductosVendidos };
};

export default useTotalProductosVendidos;
