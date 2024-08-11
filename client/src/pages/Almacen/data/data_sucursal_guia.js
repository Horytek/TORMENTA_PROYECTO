import { useState, useEffect } from 'react';
import axios from 'axios';

const useSucursalData = () => {
  const [sucursales, setSucursal] = useState([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/guia_remision/sucursal');
        
        if (response.data.code === 1) {
          const sucursales = response.data.data.map(item => ({
            id: item.id,
            nombre: item.nombre,
            direccion: item.direccion,
          }));
          setSucursal(sucursales);
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchProductos();
  }, []);

  return {sucursales, setSucursal};
};

export default useSucursalData;
