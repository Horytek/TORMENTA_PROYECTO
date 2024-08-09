import { useState, useEffect } from 'react';
import axios from 'axios';

const useVehiculoData = () => {
  const [vehiculos, setVehiculo] = useState([]);

  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/guia_remision/vehiculosguia');

        if (response.data.code === 1) {
          const vehiculos = response.data.data.map(item => ({
            tipo: item.tipo,
            placa: item.placa,
          }));
          setVehiculo(vehiculos);
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchVehiculos();
  }, []);

  return { vehiculos };
};

export default useVehiculoData;
