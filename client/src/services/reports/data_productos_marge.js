import { useState, useEffect, useRef, useCallback } from 'react';
import { getTopProductosMargenRequest } from "@/api/api.reporte";

const useTopProductosMargen = (idSucursal, year, month, week, limit = 5) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheRef = useRef({});
  const lastKeyRef = useRef(null); // para evitar múltiples llamadas iguales

  const fetchTopProductosMargen = useCallback(async () => {
    const params = { id_sucursal: idSucursal, year, month, week, limit };
    
    // Eliminar valores vacíos o undefined
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    const cacheKey = JSON.stringify(params);

    // No volver a ejecutar si ya fue consultado
    if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    lastKeyRef.current = cacheKey;

    try {
      const response = await getTopProductosMargenRequest(params);
      if (response.data.code === 1 && Array.isArray(response.data.data)) {
        setData(response.data.data);
        cacheRef.current[cacheKey] = response.data.data;
      } else {
        throw new Error(response.data.message || "Respuesta inválida");
      }
    } catch (err) {
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
