import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useCantidadVentasPorCategoria = () => {
  const [ventasPorCategoria, setVentasPorCategoria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCantidadVentasPorCategoria = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:4000/api/ventas/cantidad_por_categoria');
      
      if (response.data.code === 1) {
        setVentasPorCategoria(response.data.data);
      } else {
        setError('Error en la solicitud: ' + response.data.message);
      }
    } catch (error) {
      setError('Error en la solicitud: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCantidadVentasPorCategoria();
  }, [fetchCantidadVentasPorCategoria]);

  return { ventasPorCategoria, loading, error };
};

export default useCantidadVentasPorCategoria;
