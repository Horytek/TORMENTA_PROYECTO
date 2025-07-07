import { useState, useEffect, useRef, useCallback } from 'react';
import { getTendenciaVentasRequest } from "@/api/api.reporte";

const useTendenciaVentas = (idSucursal, year, month, week) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheRef = useRef({});
  const lastKeyRef = useRef(null);

  const fetchTendenciaVentas = useCallback(async () => {
    const params = { id_sucursal: idSucursal, year, month, week };

    // Limpiar valores vacíos o undefined
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === "") {
        delete params[key];
      }
    });

    const cacheKey = JSON.stringify(params);

    // Usar caché si ya existe para estos parámetros
    if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    lastKeyRef.current = cacheKey;
    setLoading(true);
    setError(null);

    try {
      const response = await getTendenciaVentasRequest(params);
      if (response.data.code === 1 && Array.isArray(response.data.data)) {
        setData(response.data.data);
        cacheRef.current[cacheKey] = response.data.data; // Cachear resultado
      } else {
        throw new Error(response.data.message || 'Error en la solicitud');
      }
    } catch (err) {
      setError('Error en la solicitud');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [idSucursal, year, month, week]);

  useEffect(() => {
    if (idSucursal && (year || month || week)) {
      fetchTendenciaVentas();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [fetchTendenciaVentas]);

  return { data, loading, error };
};

export default useTendenciaVentas;
