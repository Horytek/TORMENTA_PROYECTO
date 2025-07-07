import { useState, useEffect, useRef, useCallback } from 'react';
import { getCantidadVentasPorSubcategoriaRequest } from "@/api/api.reporte";

const useCantidadVentasPorSubcategoria = (idSucursal, year, month, week) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheRef = useRef({});
  const lastKeyRef = useRef(null);

  const fetchData = useCallback(async () => {
    const params = { id_sucursal: idSucursal, year, month, week };

    // Limpiar valores vacíos o undefined
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === "") {
        delete params[key];
      }
    });

    const cacheKey = JSON.stringify(params);

    // Si los datos están en caché y los parámetros no han cambiado, no consultar
    if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    lastKeyRef.current = cacheKey;
    setLoading(true);
    setError(null);

    try {
      const response = await getCantidadVentasPorSubcategoriaRequest(params);
      if (response.data.code === 1) {
        setData(response.data.data);
        cacheRef.current[cacheKey] = response.data.data; // Guardar en caché
      } else {
        setError('Error en la solicitud: ' + response.data.message);
        setData([]);
      }
    } catch (error) {
      setError('Error en la solicitud: ' + error.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [idSucursal, year, month, week]);

  useEffect(() => {
    if (idSucursal && (year || month || week)) {
      fetchData();
    } else {
      setData([]);
      setLoading(false);
    }
  }, [fetchData]);

  return { data, loading, error };
};

export default useCantidadVentasPorSubcategoria;
