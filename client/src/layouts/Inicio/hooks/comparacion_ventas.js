import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useComparacionTotal = (fechaInicio, fechaFin) => {
  const [comparacionVentas, setComparacionVentas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario"); // obtiene el usuario desde localStorage
    const fetchComparacionVentas = async () => {
      try {
        setLoading(true);

        const response = await axios.post('/dashboard/comparacion_ventas', {
          fechaInicio: fechaInicio || `${new Date().getFullYear()}-01-01`,
          fechaFin: fechaFin || `${new Date().getFullYear()}-12-31`,
          usuario // se envía en el body para que el backend lo use
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
