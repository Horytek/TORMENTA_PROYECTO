import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useProductoTop = (idSucursal) => { // Agregar idSucursal como parámetro
  const [productoTop, setProductoTop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductoTop = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:4000/api/reporte/producto_top', {
        params: {
          id_sucursal: idSucursal, 
        },
      });

      if (response.data.code === 1) {
        setProductoTop(response.data.data);
      } else {
        setError('Error en la solicitud: ' + response.data.message);
      }
    } catch (error) {
      setError('Error en la solicitud: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [idSucursal]); 

  useEffect(() => {
    fetchProductoTop();
  }, [fetchProductoTop]);

  return { productoTop, loading, error };
};

export default useProductoTop;
