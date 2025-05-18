import { useState, useEffect, useCallback } from 'react';
import axios from "@/api/axios";

const useCantidadVentasPorProducto = (idSucursal, year, month, week) => { 
  const [ventasPorProducto, setVentasPorProducto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCantidadVentasPorProducto = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        id_sucursal: idSucursal,
        year,
        month,
        week,
      };
      // Elimina los filtros vacíos o undefined
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === "") delete params[key];
      });

      const response = await axios.get('/reporte/cantidad_por_producto', { params });
      
      if (response.data.code === 1) {
        setVentasPorProducto(response.data.data);
      } else {
        setError('Error en la solicitud: ' + response.data.message);
      }
    } catch (error) {
      setError('Error en la solicitud: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [idSucursal, year, month, week]); 

  useEffect(() => {
    fetchCantidadVentasPorProducto();
  }, [fetchCantidadVentasPorProducto]);

  return { ventasPorProducto, loading, error };
};

export default useCantidadVentasPorProducto;