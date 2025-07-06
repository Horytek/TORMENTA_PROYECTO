import { useState, useEffect, useCallback } from 'react';
import { getTopProductosMargenRequest } from "@/api/api.reporte";

const useTopProductosMargen = (idSucursal, year, month, week, limit = 5) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTopProductosMargen = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = { id_sucursal: idSucursal, year, month, week, limit };
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === "") delete params[key];
      });

      const response = await getTopProductosMargenRequest(params);

      if (response.data.code === 1) {
        setData(response.data.data);
      } else {
        setError('Error en la solicitud');
        setData([]);
      }
    } catch (error) {
      setError('Error en la solicitud');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [idSucursal, year, month, week, limit]);

  useEffect(() => {
    fetchTopProductosMargen();
  }, [fetchTopProductosMargen]);

  return { data, loading, error };
};

export default useTopProductosMargen;