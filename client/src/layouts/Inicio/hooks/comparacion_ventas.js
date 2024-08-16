import { useState, useEffect } from "react";
import axios from "axios";

const useComparacionTotal = (fechaInicio, fechaFin) => {
  const [comparacionVentas, setComparacionVentas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComparacionVentas = async () => {
      try {
        setLoading(true);

        const response = await axios.post('http://localhost:4000/api/dashboard/comparacion_ventas', {
          fechaInicio: fechaInicio || `${new Date().getFullYear()}-01-01`,
          fechaFin: fechaFin || `${new Date().getFullYear()}-12-31`
        });

        setComparacionVentas(response.data.data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparacionVentas();
  }, [fechaInicio, fechaFin]);

  return { comparacionVentas, loading, error };
};


export default useComparacionTotal;
