import { useState, useEffect, useRef, useCallback } from 'react';
import { getTotalSalesRevenueRequest } from "@/api/api.reporte";

const useVentasData = (idSucursal, year, month, week) => {
  const [data, setData] = useState({
    totalRecaudado: 0,
    totalAnterior: 0,
    porcentaje: 0,
  });

  const [loading, setLoading] = useState(true);
  const cacheRef = useRef({});
  const lastKeyRef = useRef(null);

  const fetchVentas = useCallback(async () => {
    const params = { id_sucursal: idSucursal, year, month, week };

    // Limpiar params vacíos
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === "") {
        delete params[key];
      }
    });

    const cacheKey = JSON.stringify(params);

    // Si ya se consultó con los mismos parámetros, devolver desde caché
    if (cacheKey === lastKeyRef.current && cacheRef.current[cacheKey]) {
      setData(cacheRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    lastKeyRef.current = cacheKey;
    setLoading(true);

    try {
      const response = await getTotalSalesRevenueRequest(params);
      if (response.status === 200 && response.data.code === 1) {
        const formattedData = {
          totalRecaudado: parseFloat(response.data.totalRevenue || 0).toFixed(2),
          totalAnterior: parseFloat(response.data.totalAnterior || 0).toFixed(2),
          porcentaje: Number(response.data.porcentaje || 0).toFixed(2),
        };
        setData(formattedData);
        cacheRef.current[cacheKey] = formattedData;
      } else {
        setData({ totalRecaudado: 0, totalAnterior: 0, porcentaje: 0 });
      }
    } catch (error) {
      setData({ totalRecaudado: 0, totalAnterior: 0, porcentaje: 0 });
    } finally {
      setLoading(false);
    }
  }, [idSucursal, year, month, week]);

useEffect(() => {
  fetchVentas();
}, [fetchVentas]);

  return { ...data, loading };
};

export default useVentasData;
