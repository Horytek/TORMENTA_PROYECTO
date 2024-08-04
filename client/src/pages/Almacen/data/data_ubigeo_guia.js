import { useState, useEffect } from 'react';
import axios from 'axios';

const useSucursalData = () => {
  const [ubigeos, setUbigeo] = useState([]);

  useEffect(() => {
    const fetchUbigeos = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/guia_remision/ubigeo');
        if (response.data.code === 1) {
          const ubigeos = response.data.data.map(ubi => ({
            id: ubi.idubi,
            cod: ubi.codubi,
            departamento: ubi.departamento,
            provincia: ubi.provincia,
            distrito: ubi.distrito
          }));
          setUbigeo(ubigeos);
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchUbigeos();
  }, []);

  return { ubigeos };
};

export default useSucursalData;
