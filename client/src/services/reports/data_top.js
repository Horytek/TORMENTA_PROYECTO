import { useState, useEffect, useCallback } from "react";
import { getProductoMasVendidoRequest } from "@/api/api.reporte";

const useProductoTop = (idSucursal, year, month, week) => {
  const [productoTop, setProductoTop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductoTop = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = { id_sucursal: idSucursal, year, month, week };
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === "") delete params[key];
      });
      const response = await getProductoMasVendidoRequest(params);
      if (response.data.code === 1) {
        setProductoTop(response.data.data);
      } else {
        setProductoTop(null);
        setError('Error en la solicitud: ' + response.data.message);
      }
    } catch (err) {
      setProductoTop(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [idSucursal, year, month, week]);

  useEffect(() => {
    fetchProductoTop();
  }, [fetchProductoTop]);

  return { productoTop, loading, error };
};

export default useProductoTop;