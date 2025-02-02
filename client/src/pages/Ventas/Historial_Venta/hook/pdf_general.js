import { useState, useEffect } from "react";
import axios from "axios";

const useVentasPDF = () => {
  const [data, setData] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/reporte/ventas_pdf");
        setData(response.data.data); 
      } catch (err) {
        console.error("Error al obtener los datos de ventas:", err);
        setError(err); 
      } finally {
        setLoading(false); 
      }
    };

    fetchVentas(); 
  }, []);

  return { data, loading, error };
};

export default useVentasPDF;
