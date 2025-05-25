import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useVentasTotal = (timePeriod, sucursal = "") => {
  const [ventasTotal, setVentasTotal] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    const fetchVentasTotal = async () => {
      try {
        setLoading(true);
        const params = { tiempo: timePeriod, usuario };
        if (sucursal) params.sucursal = sucursal;

        const response = await axios.get("/dashboard/ventas_total", { params });
        const { data, cambio } = response.data;

        setVentasTotal(data);
        setPercentageChange(parseFloat(cambio));
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVentasTotal();
  }, [timePeriod, sucursal]);

  return { ventasTotal, percentageChange, loading, error };
};

export default useVentasTotal;
