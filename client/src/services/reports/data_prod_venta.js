import { useState, useEffect, useRef, useCallback } from 'react';
import { getCantidadVentasPorProductoRequest } from "@/api/api.reporte";

const useCantidadVentasPorProducto = (idSucursal, year, month, week) => {
  const [ventasPorProducto, setVentasPorProducto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Guardar los últimos parámetros usados
  const lastParamsRef = useRef({});

  const fetchCantidadVentasPorProducto = useCallback(async () => {
    const params = { id_sucursal: idSucursal, year, month, week };
    
    // Eliminar parámetros vacíos
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === "") {
        delete params[key];
      }
    });

    // Evitar consulta si los parámetros no han cambiado
    const lastParams = lastParamsRef.current;
    const paramsStr = JSON.stringify(params);
    const lastParamsStr = JSON.stringify(lastParams);

    if (paramsStr === lastParamsStr) {
      return; // No hacer consulta si los parámetros no han cambiado
    }

    lastParamsRef.current = params; // Actualizar los parámetros anteriores

    setLoading(true);
    setError(null);

    try {
      const response = await getCantidadVentasPorProductoRequest(params);
      if (response.data.code === 1) {
        setVentasPorProducto(response.data.data);
      } else {
        setError('Error en la solicitud: ' + response.data.message);
        setVentasPorProducto([]);
      }
    } catch (error) {
      setError('Error en la solicitud: ' + error.message);
      setVentasPorProducto([]);
    } finally {
      setLoading(false);
    }
  }, [idSucursal, year, month, week]);

  useEffect(() => {
    if (idSucursal && (year || month || week)) {
      fetchCantidadVentasPorProducto();
    }
  }, [fetchCantidadVentasPorProducto]);

  return { ventasPorProducto, loading, error };
};

export default useCantidadVentasPorProducto;
