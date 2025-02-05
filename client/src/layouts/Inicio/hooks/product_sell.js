import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useProductSell = (timePeriod) => {
  const [totalProductsSold, setTotalProductsSold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario"); // obtiene el usuario desde localStorage
    const fetchTotalProductsSold = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/dashboard/product_sell', {
          params: {
            tiempo: timePeriod,
            usuario, // se envía en la query para que el backend lo use
          },
        });
        setTotalProductsSold(response.data.totalProductosVendidos);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTotalProductsSold();
  }, [timePeriod]);

  return { totalProductsSold, loading, error };
};

export default useProductSell;
