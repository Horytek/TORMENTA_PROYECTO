import { useState, useEffect } from 'react';
import { getAnalisisGananciasSucursalesRequest } from "@/api/api.reporte";

const useAnalisisGananciasSucursales = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getAnalisisGananciasSucursalesRequest();
        if (response.data.code === 1) {
          setData(response.data.data);
        } else {
          setError('Error en la solicitud: ' + response.data.message);
        }
      } catch (error) {
        setError('Error en la solicitud: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export default useAnalisisGananciasSucursales;