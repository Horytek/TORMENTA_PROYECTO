import { useState, useEffect, useCallback } from 'react';
import axios from "@/api/axios";

const useTendenciaVentas = (idSucursal, year, month, week) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTendenciaVentas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        id_sucursal: idSucursal,
        year,
        month,
        week,
      };
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === "") delete params[key];
      });

      const response = await axios.get('/reporte/tendencia_ventas', { params });

      if (response.data.code === 1) {
        setData(response.data.data);
      } else {
        setError('Error en la solicitud');
      }
    } catch (error) {
      setError('Error en la solicitud');
    } finally {
      setLoading(false);
    }
  }, [idSucursal, year, month, week]);

  useEffect(() => {
    fetchTendenciaVentas();
  }, [fetchTendenciaVentas]);

  return { data, loading, error };
};

export default useTendenciaVentas;