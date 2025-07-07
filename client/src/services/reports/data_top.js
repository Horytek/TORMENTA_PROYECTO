import { useState, useEffect, useRef, useCallback } from "react";
import { getProductoMasVendidoRequest } from "@/api/api.reporte";

const useProductoTop = (idSucursal, year, month, week) => {
  const [productoTop, setProductoTop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheRef = useRef({});
  const lastKeyRef = useRef(null);

  const fetchProductoTop = useCallback(async () => {
    const params = { id_sucursal: idSucursal, year, month, week };

    // Eliminar parámetros vacíos
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === "") {
        delete params[key];
      }
    });

    const cacheKey = JSON.stringify(params);

    // Si ya se hizo la consulta con estos parámetros, usar la caché
    if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
      setProductoTop(cacheRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    lastKeyRef.current = cacheKey;
    setLoading(true);
    setError(null);

    try {
      const response = await getProductoMasVendidoRequest(params);
      if (response.data.code === 1) {
        setProductoTop(response.data.data);
        cacheRef.current[cacheKey] = response.data.data; // Guardar en caché
      } else {
        setProductoTop(null);
        setError("Error en la solicitud: " + response.data.message);
      }
    } catch (err) {
      setProductoTop(null);
      setError("Error en la solicitud: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [idSucursal, year, month, week]);

  useEffect(() => {
    if (idSucursal && (year || month || week)) {
      fetchProductoTop();
    } else {
      setProductoTop(null);
      setLoading(false);
    }
  }, [fetchProductoTop]);

  return { productoTop, loading, error };
};

export default useProductoTop;
