import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useProductTop = (timePeriod, sucursal = "") => {
  const [productTop, setProductTop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    const fetchProductTop = async () => {
      try {
        setLoading(true);
        // Solo se incluye sucursal en los parámetros si tiene un valor.
        const params = { tiempo: timePeriod, usuario };
        if (sucursal) {
          params.sucursal = sucursal;
        }
        const response = await axios.get("/dashboard/product_top", { params });
        setProductTop(response.data.data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductTop();
  }, [timePeriod, sucursal]);

  return { productTop, loading, error };
};

export default useProductTop;
