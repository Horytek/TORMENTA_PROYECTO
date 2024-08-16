import { useState, useEffect, useCallback } from 'react';
//import axios from 'axios';
import axios from "../../../api/axios";

// Función para obtener ventas
const useVentasData = (filters) => {
  const [ventas, setVentas] = useState([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [ventasPerPage, setVentasPerPage] = useState(10);

  const fetchVentas = useCallback(async () => {
    try {
      const response = await axios.get('/ventas', {
        params: {
          page: currentPage - 1,
          limit: ventasPerPage,
          nom_tipocomp: filters.comprobanteSeleccionado,
          razon_social: filters.razon,
          nombre_sucursal: filters.sucursalSeleccionado,
          fecha_i: filters.fecha_i,
          fecha_e: filters.fecha_e,
        }
      });
      if (response.data.code === 1) {
        const ventas = response.data.data.map(venta => ({
          id: venta.id,
          serieNum: venta.serieNum,
          num: venta.num,
          tipoComprobante: venta.tipoComprobante,
          cliente: venta.cliente_r ? venta.cliente_r : `${venta.cliente_n}`,
          ruc: venta.ruc ? venta.ruc : `${venta.dni}`,
          fechaEmision: venta.fecha ? venta.fecha : '',
          fecha_iso: venta.fecha_iso,
          metodo_pago: venta.metodo_pago,
          id_anular: venta.id_anular,
          anular: venta.anular,
          id_anular_b: venta.id_anular_b,
          anular_b: venta.anular_b,
          estado_sunat: venta.estado_sunat,
          id_venta_boucher: venta.id_venta_boucher,
          ubicacion: venta.ubicacion,
          usua_vendedor:venta.usua,
          nombre_sucursal: venta.nombre_sucursal,
          observacion: venta.observacion,
          igv: `S/ ${parseFloat(venta.igv).toFixed(2)}`,
          total: `S/ ${parseFloat(venta.total).toFixed(2)}`,
          cajero: venta.cajero,
          cajeroId: venta.cajeroId,
          estado: venta.estado === 0 ? 'Anulada' :
          venta.estado === 1 ? 'Aceptada' :
          venta.estado === 2 ? 'En proceso' :
          'Desconocido', // Valor por defecto para estados no especificados
          detalles: venta.detalles.map(detalle => ({
            codigo: detalle.codigo.toString().padStart(3, '0'),
            nombre: detalle.nombre,
            cantidad: detalle.cantidad,
            undm: detalle.undm,
            nom_marca: detalle.marca,
            precio: `S/ ${parseFloat(detalle.precio).toFixed(2)}`,
            descuento: `S/ ${(detalle.descuento || 0).toFixed(2)}`,
            igv: `S/ ${((detalle.precio * 0.18).toFixed(2))}`,
            subtotal: `S/ ${parseFloat(detalle.subtotal).toFixed(2)}`
          }))
        }));
        setVentas(ventas);
        setTotalVentas(response.data.totalVentas);
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
  }, [filters, currentPage, ventasPerPage]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);



  const removeVenta = (id) => {
    setVentas(ventas.filter(venta => venta.id !== id));
  };

  const totalPages = Math.ceil(totalVentas / ventasPerPage);
  
  const [detalles, setDetalles] = useState([]);

  const addVenta = (nuevaVenta) => {
    setVentas([...ventas, nuevaVenta]);
  };

  const addDetalle = (nuevoDetalle) => {
    setDetalles([...detalles, nuevoDetalle]);
  };

  const getTotalRecaudado = () => {
    return ventas.reduce((total, venta) => {
      const subtotalVenta = venta.detalles.reduce((subtotal, detalle) => {
        return subtotal + parseFloat(detalle.subtotal.replace('S/ ', ''));
      }, 0);
      return total + subtotalVenta;
    }, 0).toFixed(2);
  };
  
  const totalRecaudado = getTotalRecaudado();

    // Función para calcular el total de efectivo
    const getTotalEfectivo = () => {
      return ventas.reduce((total, venta) => {
        const pagos = venta.metodo_pago.split(', ');
        const pagoEfectivo = pagos.find(pago => pago.startsWith('EFECTIVO'));
  
        if (pagoEfectivo) {
          const monto = parseFloat(pagoEfectivo.split(':')[1]) || 0;
          return total + monto;
        }
        return total;
      }, 0).toFixed(2);
    };
  
    const totalEfectivo = getTotalEfectivo();
  
    // Función para calcular el total de pagos electrónicos
    const getTotalPagoElectronico = () => {
      return ventas.reduce((total, venta) => {
        const pagos = venta.metodo_pago.split(', ');
        const pagosElectronicos = pagos.filter(pago => !pago.startsWith('EFECTIVO'));
  
        const totalElectronico = pagosElectronicos.reduce((suma, pago) => {
          const monto = parseFloat(pago.split(':')[1]) || 0;
          return suma + monto;
        }, 0);
  
        return total + totalElectronico;
      }, 0).toFixed(2);
    };
  
    const totalPagoElectronico = getTotalPagoElectronico();

  const updateDetalle = (updatedDetalle) => {
    setDetalles(prevDetalles =>
      prevDetalles.map(detalle =>
        detalle.codigo === updatedDetalle.codigo ? updatedDetalle : detalle
      )
    );
  };

  const updateVenta = (id, updatedData) => {
    setVentas(ventas.map(venta => 
      venta.id === id ? { ...venta, ...updatedData } : venta
    ));
  };

  const removeDetalle = (codigo) => {
    setDetalles(prevDetalles =>
      prevDetalles.filter(detalle => detalle.codigo !== codigo)
    );
  };

  const refetchVentas = () => {
    fetchVentas();
  };


  return { ventas, removeVenta, currentPage, setCurrentPage, totalPages, ventasPerPage, setVentasPerPage, detalles, addVenta, addDetalle, removeDetalle, updateDetalle, totalRecaudado,updateVenta,refetchVentas,totalEfectivo,totalPagoElectronico};
};


export default useVentasData;
