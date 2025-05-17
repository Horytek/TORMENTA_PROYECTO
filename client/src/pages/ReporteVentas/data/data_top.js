import { useState, useEffect, useCallback } from "react";
import axios from "@/api/axios";

const useProductoTop = (idSucursal, year, month, week) => {
  const [productoTop, setProductoTop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductoTop = useCallback(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get("/reporte/producto_top", {
          params: { id_sucursal: idSucursal, year, month, week },
          signal: controller.signal,
        });

        if (response.data.code === 1) {
          setProductoTop(response.data.data);
        } else {
          const errMsg = "Error en la solicitud: " + response.data.message;
          console.error(errMsg);
          setError(new Error(errMsg));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          if (err.response && err.response.status === 404) {
            setProductoTop(null);
            setError(null);
          } else {
            console.error("Error en la solicitud: " + err.message);
            setError(err);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => controller.abort();
  }, [idSucursal, year, month, week]);

  useEffect(() => {
    const cancelRequest = fetchProductoTop();
    return () => cancelRequest?.();
  }, [fetchProductoTop]);

  return { productoTop, loading, error };
};

export default useProductoTop;