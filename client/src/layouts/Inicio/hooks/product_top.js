import { useState, useEffect } from "react";
import axios from "axios";

const useProductTop = (timePeriod) => {
  const [productTop, setProductTop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductTop = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:4000/api/dashboard/product_top', {
          params: {
            tiempo: timePeriod, 
          },
        });
        setProductTop(response.data.data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductTop();
  }, [timePeriod]);

  return { productTop, loading, error };
};

export default useProductTop;
