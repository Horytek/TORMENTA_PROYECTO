import { useState, useEffect, useRef } from "react";
import { getVentasPDFRequest } from "@/api/api.reporte";

const useVentasPDF = (params = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cacheRef = useRef({});
  const lastKeyRef = useRef(null);

  useEffect(() => {
    const fetchVentas = async () => {
      // Limpiar parámetros vacíos o undefined
      const cleanedParams = { ...params };
      Object.keys(cleanedParams).forEach((key) => {
        if (cleanedParams[key] === undefined || cleanedParams[key] === "") {
          delete cleanedParams[key];
        }
      });

      // Si no hay parámetros válidos, evitar la llamada
      if (Object.keys(cleanedParams).length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      const cacheKey = JSON.stringify(cleanedParams);

      // Si ya se hizo esta consulta, usar la caché
      if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
        setData(cacheRef.current[cacheKey]);
        setLoading(false);
        return;
      }

      lastKeyRef.current = cacheKey;
      setLoading(true);
      setError(null);

      try {
        const response = await getVentasPDFRequest(cleanedParams);
        if (response.data && response.data.data) {
          setData(response.data.data);
          cacheRef.current[cacheKey] = response.data.data; // Guardar en caché
        } else {
          setData([]);
          setError("No se encontraron datos.");
        }
      } catch (err) {
        setError("Error en la solicitud: " + err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, [JSON.stringify(params)]);

  return { data, loading, error };
};

export default useVentasPDF;
