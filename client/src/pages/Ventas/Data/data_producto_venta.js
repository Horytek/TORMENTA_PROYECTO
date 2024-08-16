import { useState, useEffect } from 'react';
//import axios from 'axios';
import axios from "../../../api/axios";

const useProductosData = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await axios.get('/ventas/producto_venta', {
          params: {
            id_sucursal: localStorage.getItem('usuario'),
          }
        });
        
        if (response.data.code === 1) {
          const productos = response.data.data.map(item => ({
            codigo: item.codigo,
            nombre: item.nombre,
            precio: parseFloat(item.precio),
            stock: parseInt(item.stock),
            undm: item.undm,
            nom_marca: item.nom_marca,
            categoria: item.categoria_p,
            codigo_barras: item.codigo_barras,
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
