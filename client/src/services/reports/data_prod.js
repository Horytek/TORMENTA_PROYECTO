import { useState, useEffect, useRef } from 'react';
import { getTotalProductosVendidosRequest } from "@/api/api.reporte";

const useTotalProductosVendidos = (idSucursal, year, month, week) => { 
  const [data, setData] = useState({
    totalProductosVendidos: 0,
    totalAnterior: 0,
    porcentaje: 0,
    subcategorias: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Guardar los últimos parámetros usados
  const lastParams = useRef({});

  useEffect(() => {
    const params = { id_sucursal: idSucursal, year, month, week };
    // Limpiar params vacíos
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === "") delete params[key];
    });

    // Evitar consulta si los parámetros no han cambiado
    const paramsString = JSON.stringify(params);
    if (lastParams.current.paramsString === paramsString) return;
    lastParams.current.paramsString = paramsString;

    setLoading(true);
    setError(null);

    getTotalProductosVendidosRequest(params)
      .then(response => {
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
      })
      .catch(error => {
        setData({
          totalProductosVendidos: 0,
          totalAnterior: 0,
          porcentaje: 0,
          subcategorias: {},
        });
        setError(error.message || "Error en la consulta");
      })
      .finally(() => setLoading(false));
  }, [idSucursal, year, month, week]);

  return { ...data, loading, error };
};

export default useTotalProductosVendidos;