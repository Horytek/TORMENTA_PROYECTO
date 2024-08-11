import { useState, useEffect } from "react";
import axios from "axios";

const useComparacionTotal = () => {
  const [comparacionVentas, setComparacionVentas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComparacionVentas = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:4000/api/dashboard/comparacion_ventas');
        
        setComparacionVentas(response.data.data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparacionVentas();
  }, []);  

  return { comparacionVentas, loading, error };
};

export default useComparacionTotal;
