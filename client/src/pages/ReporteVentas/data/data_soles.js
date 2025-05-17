import { useState, useEffect, useCallback } from 'react';
import axios from "@/api/axios";

const useVentasData = (idSucursal, year, month, week) => { 
  const [data, setData] = useState({
    totalRecaudado: 0,
    totalAnterior: 0,
    porcentaje: 0,
  });

// ...
const fetchVentas = useCallback(async () => {
  try {
    const params = {
      id_sucursal: idSucursal,
      year,
    };
    if (month) params.month = month;
    if (week) params.week = week;

    const response = await axios.get('/reporte/ganancias', { params });

    if (response.status === 200 && response.data.code === 1) {
      setData({
        totalRecaudado: parseFloat(response.data.totalRevenue || 0).toFixed(2),
        totalAnterior: parseFloat(response.data.totalAnterior || 0).toFixed(2),
        porcentaje: Number(response.data.porcentaje || 0).toFixed(2),
      });
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
}, [idSucursal, year, month, week]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  return data;
};

export default useVentasData;