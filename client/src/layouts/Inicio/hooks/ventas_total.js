import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useVentasTotal = (timePeriod) => {
  const [ventasTotal, setVentasTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVentasTotal = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/dashboard/ventas_total', {
          params: {
            tiempo: timePeriod, 
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
