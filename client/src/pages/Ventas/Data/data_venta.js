import { useState, useEffect } from 'react';
import axios from 'axios';

const getVentasRequest = () => {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/ventas');
        if (response.data.code === 1) {
          const ventas = response.data.data.map(venta => ({
            id: venta.id,
            serieNum: venta.serieNum,
            num: venta.num,
            tipoComprobante: venta.tipoComprobante,
            cliente: venta.cliente_r ? venta.cliente_r : `${venta.cliente_n} (DNI: ${venta.dni})`,
            ruc: venta.ruc ? venta.ruc : 'N/A', 
            fechaEmision: venta.fecha,
            igv: `S/ ${parseFloat(venta.igv).toFixed(2)}`,
            total: `S/ ${parseFloat(venta.total).toFixed(2)}`,
            cajero: venta.cajero,
            cajeroId: venta.cajeroId,
            estado: venta.estado === 1 ? 'Inactivo' : 'Activo',
            detalles: venta.detalles.map(detalle => ({
              codigo: detalle.codigo.toString().padStart(3, '0'),
              nombre: detalle.nombre,
              cantidad: detalle.cantidad,
              precio: `S/ ${parseFloat(detalle.precio).toFixed(2)}`,
              descuento: `S/ ${(detalle.descuento || 0).toFixed(2)}`,
              igv: `S/ ${((detalle.precio * 0.18).toFixed(2))}`,
              subtotal: `S/ ${parseFloat(detalle.subtotal).toFixed(2)}`
            }))
          }));
          setVentas(ventas);
        } else {
          console.error('Error en la solicitud: ', response.data.message);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };

    fetchVentas();
  }, []);

  const removeVenta = (id) => {
    setVentas(ventas.filter(venta => venta.id !== id));
  };

  return { ventas, removeVenta };
};

export default getVentasRequest;
