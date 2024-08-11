import { useState, useEffect } from "react";
import axios from "axios";

const useProductSell = (timePeriod) => {
  const [totalProductsSold, setTotalProductsSold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalProductsSold = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:4000/api/dashboard/product_sell', {
          params: {
            tiempo: timePeriod, 
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
