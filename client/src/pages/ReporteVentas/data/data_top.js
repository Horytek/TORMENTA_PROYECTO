import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useProductoTop = (idSucursal) => { 
  const [productoTop, setProductoTop] = useState(null);
  

  const fetchProductoTop = useCallback(async () => {

    try {
      const response = await axios.get('http://localhost:4000/api/reporte/producto_top', {
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

  return {productoTop};
};

export default useProductoTop;
