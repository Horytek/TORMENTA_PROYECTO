import { useState, useEffect, useCallback } from 'react';
import axios from "@/api/axios";

const useTotalProductosVendidos = (idSucursal, year, month, week) => { 
  const [data, setData] = useState({
    totalProductosVendidos: 0,
    totalAnterior: 0,
    porcentaje: 0,
    subcategorias: {},
  });

  const fetchProductos = useCallback(async () => {
    try {
      const response = await axios.get('/reporte/productos_vendidos', {
        params: {
          id_sucursal: idSucursal,
          year,
          month,
          week,
        },
      });

      if (response.status === 200 && response.data.code === 1) {
        setData({
          totalProductosVendidos: parseInt(response.data.totalProductosVendidos || 0, 10),
          totalAnterior: parseInt(response.data.totalAnterior || 0, 10),
          porcentaje: parseFloat(response.data.porcentaje || 0).toFixed(2),
          subcategorias: response.data.subcategorias || {},
        });
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
  }, [idSucursal, year, month, week]); 

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  return data;
};

export default useTotalProductosVendidos;