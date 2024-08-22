import { useState, useEffect, useCallback } from 'react';
import axios from "@/api/axios";

const useProductoTop = (idSucursal) => { 
  const [productoTop, setProductoTop] = useState(null);
  const [loading, setLoading] = useState(true); // Define the loading state

  const fetchProductoTop = useCallback(async () => {
    setLoading(true); 
    try {
      const response = await axios.get('/reporte/producto_top', {
        params: {
          id_sucursal: idSucursal, 
        },
      });

      if (response.data.code === 1) {
        setProductoTop(response.data.data);
      } else {
        console.error('Error en la solicitud: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ' + error.message);
    } finally {
      setLoading(false); 
    }
  }, [idSucursal]); 

  useEffect(() => {
    fetchProductoTop();
  }, [fetchProductoTop]);

  return { productoTop, loading }; 
};

export default useProductoTop;
