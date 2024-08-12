import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useTotalProductosVendidos = () => {
  const [totalProductosVendidos, setTotalProductosVendidos] = useState(0);

  const fetchTotalProductosVendidos = useCallback(async () => {
    try {
      const response = await axios.post('http://localhost:4000/api/reporte/productos_vendidos');
  
      if (response.data.code === 1) {
        setTotalProductosVendidos(response.data.totalProductosVendidos);
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
  }, []);

  useEffect(() => {
    fetchTotalProductosVendidos();
  }, [fetchTotalProductosVendidos]);

  return { totalProductosVendidos };
};

export default useTotalProductosVendidos;
