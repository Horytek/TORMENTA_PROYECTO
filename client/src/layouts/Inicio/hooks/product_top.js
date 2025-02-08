import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useProductTop = (timePeriod, sucursal = "") => {
  const [productTop, setProductTop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    const fetchProductTop = async () => {
      try {
        setLoading(true);
        const params = { tiempo: timePeriod, usuario: storedUser };
        if (sucursal) {
          params.sucursal = sucursal;
        }
        const response = await axios.get("/dashboard/product_top", { params });
        setProductTop(response.data.data);
        setError(null);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setProductTop(null);
          setError(null);
        } else {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProductTop();
  }, [timePeriod, sucursal]);

  return { productTop, loading, error };
};

export default useProductTop;
