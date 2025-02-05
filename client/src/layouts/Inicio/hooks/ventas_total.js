import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useVentasTotal = (timePeriod) => {
  const [ventasTotal, setVentasTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario"); // obtiene el usuario desde localStorage
    const fetchVentasTotal = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/dashboard/ventas_total", {
          params: {
            tiempo: timePeriod,
            usuario, // se envía en la query para que el backend lo use
          },
        });
        setVentasTotal(response.data.data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVentasTotal();
  }, [timePeriod]);

  return { ventasTotal, loading, error };
};

export default useVentasTotal;
