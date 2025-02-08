import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useProductSell = (timePeriod, sucursal = "") => {
  const [totalProductsSold, setTotalProductsSold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario"); // obtiene el usuario desde localStorage
    const fetchTotalProductsSold = async () => {
      try {
        setLoading(true);
        const params = { tiempo: timePeriod, usuario };
        if (sucursal) {
          params.sucursal = sucursal;
        }
        const response = await axios.get('/dashboard/product_sell', { params });
        setTotalProductsSold(response.data.totalProductosVendidos);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTotalProductsSold();
  }, [timePeriod, sucursal]);

  return { totalProductsSold, loading, error };
};

export default useProductSell;
