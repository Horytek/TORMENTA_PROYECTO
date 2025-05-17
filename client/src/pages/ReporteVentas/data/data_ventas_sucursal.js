import { useState, useEffect, useCallback } from "react";
import axios from "@/api/axios";

const useVentasSucursal = (year, month, week) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVentasSucursal = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("/reporte/ventas_sucursal", {
        params: { year, month, week },
      });

      if (response.data.code === 1) {
        setData(response.data.data);
      } else {
        setError("Error en la solicitud: " + response.data.message);
      }
    } catch (err) {
      setError("Error en la solicitud: " + err.message);
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