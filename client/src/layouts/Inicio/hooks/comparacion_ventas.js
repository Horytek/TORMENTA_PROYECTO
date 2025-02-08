import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useComparacionTotal = (fechaInicio, fechaFin, sucursal) => {
  const [comparacionVentas, setComparacionVentas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    const fetchComparacionVentas = async () => {
      try {
        setLoading(true);
        const params = {
          fechaInicio: fechaInicio || `${new Date().getFullYear()}-01-01`,
          fechaFin: fechaFin || `${new Date().getFullYear()}-12-31`,
          usuario
        };
        // Incluye 'sucursal' únicamente si tiene valor
        if (sucursal) {
          params.sucursal = sucursal.trim();
        }
        console.log("ComparacionVentas params:", params);
        const response = await axios.get("/dashboard/comparacion_ventas", { params });
        setComparacionVentas(response.data.data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparacionVentas();
  }, [fechaInicio, fechaFin, sucursal]);

  return { comparacionVentas, loading, error };
};

export default useComparacionTotal;
