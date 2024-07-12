// VentasData.jsx
import { useState } from 'react';

const useVentasData = () => {
  const [ventas, setVentas] = useState([
    {
      id: 1,
      serieNum: '001',
      num: '4000045',
      tipoComprobante: 'Factura',
      cliente: 'Empresa VALDOS I.R.L',
      ruc: '10524578961',
      fechaEmision: '2024-01-03',
      igv: 'S/ 26.64',
      total: 'S/ 174.64',
      cajero: 'Julio Jeanpierre Castañeda',
      cajeroId: '78541236',
      estado: 'Inactivo',
      detalles: [
        { codigo: '001', nombre: 'Pantalon Jean Resgasdo Talla 32 - Azul', cantidad: 2, precio: 'S/ 50', descuento: 'S/ 5', igv: 'S/ 10', subtotal: 'S/ 95' },
        { codigo: '002', nombre: 'Vestido jean Talla 28 - Celeste', cantidad: 1, precio: 'S/ 100', descuento: 'S/ 10', igv: 'S/ 18', subtotal: 'S/ 108' },
        { codigo: '003', nombre: 'Vestido jean Talla 28 - Rojo', cantidad: 3, precio: 'S/ 20', descuento: 'S/ 2', igv: 'S/ 4', subtotal: 'S/ 56' }
      ]
    },
    {
      id: 2,
      serieNum: '001',
      num: '1200367',
      tipoComprobante: 'Boleta',
      cliente: 'Denis Cordova Moran',
      ruc: '14151289',
      fechaEmision: '2024-01-03',
      igv: 'S/ 0.90',
      total: 'S/ 5.90',
      cajero: 'Julio Jeanpierre Castañeda',
      cajeroId: '78541236',
      estado: 'Activo',
      detalles: [
        { codigo: '004', nombre: 'Producto D', cantidad: 1, precio: 'S/ 5', descuento: 'S/ 0', igv: 'S/ 0.9', subtotal: 'S/ 5.9' }
      ]
    },
    {
      id: 3,
      serieNum: '001',
      num: '1000074',
      tipoComprobante: 'Nota',
      cliente: 'N/A',
      ruc: '',
      fechaEmision: '2024-01-03',
      igv: 'S/ 0.00',
      total: 'S/ 26.00',
      cajero: 'Julio Jeanpierre Castañeda',
      cajeroId: '78541236',
      estado: 'Activo',
      detalles: [
        { codigo: '005', nombre: 'Producto E', cantidad: 1, precio: 'S/ 25', descuento: 'S/ 0', igv: 'S/ 4.5', subtotal: 'S/ 29.5' }
      ]
    }
  ]);

  const [detalles, setDetalles] = useState([]);

  const addVenta = (nuevaVenta) => {
    setVentas([...ventas, nuevaVenta]);
  };

  const addDetalle = (nuevoDetalle) => {
    setDetalles([...detalles, nuevoDetalle]);
  };

  const updateDetalle = (updatedDetalle) => {
    setDetalles(prevDetalles =>
      prevDetalles.map(detalle =>
        detalle.codigo === updatedDetalle.codigo ? updatedDetalle : detalle
      )
    );
  };

  const removeVenta = (id) => {
    const updatedVentas = ventas.filter((venta) => venta.id !== id);
    setVentas(updatedVentas);
  };

  const removeDetalle = (codigo) => {
    setDetalles(prevDetalles =>
      prevDetalles.filter(detalle => detalle.codigo !== codigo)
    );
  };

  return { ventas, detalles, addVenta, addDetalle, removeVenta, removeDetalle, updateDetalle };
};

export default useVentasData;
