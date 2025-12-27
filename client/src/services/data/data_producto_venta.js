import { useState, useEffect } from 'react';
//import axios from 'axios';
import axios from "@/api/axios";
import { useUserStore } from "@/store/useStore";
import {
  getProductosVentasRequest
} from "@/api/api.ventas";
import useSucursalData from './data_sucursal_venta';


const useProductosData = () => {
  const [productos, setProductos] = useState([]);
  const sur = useUserStore((state) => state.sur);
  const { sucursales } = useSucursalData();

  useEffect(() => {
    // Wait for store name AND sucursal list to be ready
    if (!sur || sucursales.length === 0) return;

    // Resolve ID from Name
    const foundSucursal = sucursales.find(s => s.nombre === sur);
    const id_to_send = foundSucursal ? foundSucursal.id : sur;
    // If not found, fallback to sending 'sur' (name) -> backend treats as username (legacy compat?)
    // But primarily we want the ID.

    const fetchProductos = async () => {
      try {
        const response = await getProductosVentasRequest({
          id_sucursal: id_to_send,
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
  }, [sur, sucursales]); // Re-run if store changes or list loads

  return { productos, setProductos };
};

export default useProductosData;
