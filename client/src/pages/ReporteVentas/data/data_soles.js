import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useVentasData = (idSucursal) => { 
  const [totalRecaudado, setTotalRecaudado] = useState(0);

  const fetchVentas = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/reporte/ganancias', {
        params: {
          id_sucursal: idSucursal,
        },
      });

      if (response.status === 200) {
        const totalRecaudado = parseFloat(response.data.totalRevenue || 0).toFixed(2);
        setTotalRecaudado(totalRecaudado);
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
  }, [idSucursal]); 

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  return { totalRecaudado };
};

export default useVentasData;
