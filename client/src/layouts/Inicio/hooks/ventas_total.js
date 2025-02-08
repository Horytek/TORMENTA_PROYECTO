import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useVentasTotal = (timePeriod, sucursal = "") => {
  const [ventasTotal, setVentasTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario"); // obtiene el usuario desde localStorage
    const fetchVentasTotal = async () => {
      try {
        setLoading(true);
        const params = { tiempo: timePeriod, usuario };
        if (sucursal) {
          params.sucursal = sucursal;
        }
        const response = await axios.get("/dashboard/ventas_total", { params });
        setVentasTotal(response.data.data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVentasTotal();
  }, [timePeriod, sucursal]);

  return { ventasTotal, loading, error };
};

export default useVentasTotal;
