import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useVentasPDF = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        // Usa ruta relativa; el proxy/baseURL se encarga del host
        const response = await axios.get("/reporte/ventas_pdf");
        setData(response.data?.data || []);
      } catch (err) {
        console.error("Error al obtener los datos de ventas:", err);
        setError(err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, []);

  return { data, loading, error };
};

export default useVentasPDF;