import { useState, useEffect, useCallback } from 'react';
import { getCantidadVentasPorProductoRequest } from "@/api/api.reporte";

const useCantidadVentasPorProducto = (idSucursal, year, month, week) => { 
  const [ventasPorProducto, setVentasPorProducto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCantidadVentasPorProducto = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = { id_sucursal: idSucursal, year, month, week };
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === "") delete params[key];
      });
      const response = await getCantidadVentasPorProductoRequest(params);
      if (response.data.code === 1) {
        setVentasPorProducto(response.data.data);
      } else {
        setError('Error en la solicitud: ' + response.data.message);
        setVentasPorProducto([]);
      }
    } catch (error) {
      setError('Error en la solicitud: ' + error.message);
      setVentasPorProducto([]);
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