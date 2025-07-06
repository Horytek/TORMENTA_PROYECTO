import { useState, useEffect, useCallback } from 'react';
import { getTotalSalesRevenueRequest } from "@/api/api.reporte";

const useVentasData = (idSucursal, year, month, week) => { 
  const [data, setData] = useState({
    totalRecaudado: 0,
    totalAnterior: 0,
    porcentaje: 0,
  });

  const fetchVentas = useCallback(async () => {
    try {
      const params = { id_sucursal: idSucursal, year, month, week };
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === "") delete params[key];
      });
      const response = await getTotalSalesRevenueRequest(params);
      if (response.status === 200 && response.data.code === 1) {
        setData({
          totalRecaudado: parseFloat(response.data.totalRevenue || 0).toFixed(2),
          totalAnterior: parseFloat(response.data.totalAnterior || 0).toFixed(2),
          porcentaje: Number(response.data.porcentaje || 0).toFixed(2),
        });
      } else {
        setData({
          totalRecaudado: 0,
          totalAnterior: 0,
          porcentaje: 0,
        });
      }
    } catch (error) {
      setData({
        totalRecaudado: 0,
        totalAnterior: 0,
        porcentaje: 0,
      });
    }
  }, [idSucursal, year, month, week]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  return data;
};

export default useVentasData;