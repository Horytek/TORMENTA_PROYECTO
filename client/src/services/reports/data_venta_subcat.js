import { useState, useEffect, useCallback } from 'react';
import { getCantidadVentasPorSubcategoriaRequest } from "@/api/api.reporte";

const useCantidadVentasPorSubcategoria = (idSucursal, year, month, week) => { 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = { id_sucursal: idSucursal, year, month, week };
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === "") delete params[key];
      });
      const response = await getCantidadVentasPorSubcategoriaRequest(params);
      if (response.data.code === 1) {
        setData(response.data.data);
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
    fetchData();
  }, [fetchData]); 

  return { data, loading, error };
};

export default useCantidadVentasPorSubcategoria;