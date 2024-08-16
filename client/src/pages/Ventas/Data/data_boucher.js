import { useState, useEffect } from 'react';
//import axios from 'axios';
import axios from "../../../api/axios";

const useBoucher = (id_venta_boucher) => {
  const [venta_B, setVenta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBoucher = async () => {
      try {
        const response = await axios.get('/ventas/venta_boucher', {
          params: { id_venta_boucher }
        });

        if (response.data.code === 1) {
          const ventaData = {
            ...response.data.data, // Si response.data.data es un objeto, no es necesario mapearlo
          };

          setVenta(ventaData);
        } else {
          setError('No se encontraron los datos de la venta');
        }
      } catch (error) {
        setError('Error al obtener los datos de la venta: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBoucher();
  }, [id_venta_boucher]);

  return { venta_B, loading, error };
};

export default useBoucher;
