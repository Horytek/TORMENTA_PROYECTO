import { useState, useEffect, useRef } from 'react';
import { getAnalisisGananciasSucursalesRequest } from "@/api/api.reporte";

const useAnalisisGananciasSucursales = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Referencia para almacenar los datos cacheados
  const cacheRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      // Si ya hay datos en caché, no volver a pedirlos
      if (cacheRef.current) {
        setData(cacheRef.current);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getAnalisisGananciasSucursalesRequest();
        if (response.data.code === 1) {
          setData(response.data.data);
          cacheRef.current = response.data.data; // Cachear los datos
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
