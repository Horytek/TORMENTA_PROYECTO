import { useState, useEffect, useCallback } from 'react';
import { getTotalProductosVendidosRequest } from "@/api/api.reporte";

const useTotalProductosVendidos = (idSucursal, year, month, week) => { 
  const [data, setData] = useState({
    totalProductosVendidos: 0,
    totalAnterior: 0,
    porcentaje: 0,
    subcategorias: {},
  });

  const fetchProductos = useCallback(async () => {
    try {
      const params = { id_sucursal: idSucursal, year, month, week };
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === "") delete params[key];
      });
      const response = await getTotalProductosVendidosRequest(params);
      if (response.status === 200 && response.data.code === 1) {
        setData({
          totalProductosVendidos: parseInt(response.data.totalProductosVendidos || 0, 10),
          totalAnterior: parseInt(response.data.totalAnterior || 0, 10),
          porcentaje: parseFloat(response.data.porcentaje || 0).toFixed(2),
          subcategorias: response.data.subcategorias || {},
        });
      } else {
        setData({
          totalProductosVendidos: 0,
          totalAnterior: 0,
          porcentaje: 0,
          subcategorias: {},
        });
      }
    } catch (error) {
      setData({
        totalProductosVendidos: 0,
        totalAnterior: 0,
        porcentaje: 0,
        subcategorias: {},
      });
    }
  }, [idSucursal, year, month, week]); 

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  return data;
};

export default useTotalProductosVendidos;