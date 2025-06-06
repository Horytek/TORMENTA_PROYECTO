import { useState, useEffect } from "react";
import axios from "@/api/axios";
import { useUserStore } from "@/store/useStore";

const useProductSell = (timePeriod, sucursal = "") => {
  const [totalProductsSold, setTotalProductsSold] = useState(0);
  const [percentageChange, setPercentageChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nombre = useUserStore(state => state.nombre);

  useEffect(() => {
    const usuario = nombre;
    const fetchTotalProductsSold = async () => {
      try {
        setLoading(true);
        const params = { tiempo: timePeriod, usuario };
        if (sucursal) params.sucursal = sucursal;

        const response = await axios.get('/dashboard/product_sell', { params });
        const { totalProductosVendidos, cambio } = response.data;

        setTotalProductsSold(totalProductosVendidos);
        setPercentageChange(parseFloat(cambio));
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalProductsSold();
  }, [timePeriod, sucursal]);

  return { totalProductsSold, percentageChange, loading, error };
};

export default useProductSell;
