import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useCantidadVentasPorProducto = (idSucursal) => { 
  const [ventasPorProducto, setVentasPorProducto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCantidadVentasPorProducto = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:4000/api/reporte/cantidad_por_producto', {
        params: {
          id_sucursal: idSucursal, 
        },
      });
      
      if (response.data.code === 1) {
        setVentasPorProducto(response.data.data);
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
    fetchCantidadVentasPorProducto();
  }, [fetchCantidadVentasPorProducto]);

  return { ventasPorProducto, loading, error };
};

export default useCantidadVentasPorProducto;
