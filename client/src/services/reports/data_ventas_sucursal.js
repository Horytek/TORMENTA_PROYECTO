import { useState, useEffect, useRef, useCallback } from "react";
import { getSucursalMayorRendimientoRequest } from "@/api/api.reporte";

const useVentasSucursal = (year, month, week) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheRef = useRef({});
  const lastKeyRef = useRef(null);

  const fetchVentasSucursal = useCallback(async () => {
    const params = { year, month, week };

    // Eliminar valores vacíos
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === "") {
        delete params[key];
      }
    });

    // Si no hay ningún parámetro válido, no continuar
    if (Object.keys(params).length === 0) {
      setData([]);
      setLoading(false);
      return;
    }

    const cacheKey = JSON.stringify(params);

    // Verificar si ya se tiene la consulta en caché
    if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    lastKeyRef.current = cacheKey;
    setLoading(true);
    setError(null);

    try {
      const response = await getSucursalMayorRendimientoRequest(params);
      if (response.data.code === 1) {
        setData(response.data.data);
        cacheRef.current[cacheKey] = response.data.data; // Guardar en caché
      } else {
        setError("Error en la solicitud: " + response.data.message);
        setData([]);
      }
    } catch (err) {
      setError("Error en la solicitud: " + err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, week]);

  useEffect(() => {
    fetchVentasSucursal();
  }, [fetchVentasSucursal]);

  return { data, loading, error };
};

export default useVentasSucursal;
