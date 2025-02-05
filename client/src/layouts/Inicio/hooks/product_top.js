import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useProductTop = (timePeriod) => {
  const [productTop, setProductTop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario"); // obtiene el usuario desde localStorage
    const fetchProductTop = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/dashboard/product_top", {
          params: {
            tiempo: timePeriod,
            usuario, // se envía en la query para que el backend lo use
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
