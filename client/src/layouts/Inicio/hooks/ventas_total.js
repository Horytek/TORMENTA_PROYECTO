import { useState, useEffect } from "react";
import axios from "@/api/axios";
import { useUserStore } from "@/store/useStore";

const useVentasTotal = (timePeriod, sucursal = "") => {
  const [ventasTotal, setVentasTotal] = useState(0);
  const [ventasAnterior, setVentasAnterior] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nombre = useUserStore(state => state.nombre);

  useEffect(() => {
    const usuario = nombre;
    const fetchVentasTotal = async () => {
      try {
        setLoading(true);
        const params = { tiempo: timePeriod, usuario };
        if (sucursal) params.sucursal = sucursal;

        const response = await axios.get("/dashboard/ventas_total", { params });
        const { data, anterior, cambio, totalRegistros: totalClientes } = response.data;

        setVentasTotal(data);
        setVentasAnterior(anterior || 0);
        setPercentageChange(Number(cambio) || 0);
        setTotalRegistros(totalClientes || 0);
        setError(null);
      } catch (err) {
        setError(err);
        setVentasAnterior(0);
        setTotalRegistros(0);
      } finally {
        setLoading(false);
      }
    };

    fetchVentasTotal();
  }, [timePeriod, sucursal]);

  return { ventasTotal, ventasAnterior, percentageChange, totalRegistros, loading, error };
};

export default useVentasTotal;