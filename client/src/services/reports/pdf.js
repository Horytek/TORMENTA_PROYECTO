import { useState, useEffect } from "react";
import { getVentasPDFRequest } from "@/api/api.reporte";

const useVentasPDF = (params = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVentas = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getVentasPDFRequest(params);
        if (response.data && response.data.data) {
          setData(response.data.data);
        } else {
          setData([]);
          setError("No se encontraron datos.");
        }
      } catch (err) {
        setError(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
    // eslint-disable-next-line
  }, [JSON.stringify(params)]);

  return { data, loading, error };
};

export default useVentasPDF;