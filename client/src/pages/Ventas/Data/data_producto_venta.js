import { useState, useEffect } from 'react';
import axios from 'axios';

const useProductosData = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/ventas/producto_venta');
        
        if (response.data.code === 1) {
          const productos = response.data.data.map(item => ({
            codigo: item.codigo,
            nombre: item.nombre,
            precio: parseFloat(item.precio),
            stock: parseInt(item.stock),
            categoria: item.categoria_p,
          }));
          setProductos(productos);
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchProductos();
  }, []);

  return {productos, setProductos};
};

export default useProductosData;
