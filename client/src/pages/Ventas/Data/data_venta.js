import { useState, useEffect} from 'react';
import axios from 'axios';// Asegúrate de importar PropTypes
/*import FiltrosVentas from '../Venta/ComponentsVentas/FiltrosVentas';*/


const fetchVentas = async (filters, currentPage, ventasPerPage, setVentas, setTotalVentas) => {
  try {
    const response = await axios.get('http://localhost:4000/api/ventas', {
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
        fechaEmision: venta.fecha,
        igv: `S/ ${parseFloat(venta.igv).toFixed(2)}`,
        total: `S/ ${parseFloat(venta.total).toFixed(2)}`,
        cajero: venta.cajero,
        cajeroId: venta.cajeroId,
        estado: venta.estado === 0 ? 'Inactivo' :
        venta.estado === 1 ? 'Activo' :
        venta.estado === 2 ? 'En proceso' :
        'Desconocido', // Valor por defecto para estados no especificados
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
      setTotalVentas(response.data.totalVentas);
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const useVentasData = (filters) => {
  const [ventas, setVentas] = useState([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [ventasPerPage, setVentasPerPage] = useState(10);

  useEffect(() => {
    fetchVentas(filters, currentPage, ventasPerPage, setVentas, setTotalVentas);
  }, [filters, currentPage, ventasPerPage]);


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

  const updateDetalle = (updatedDetalle) => {
    setDetalles(prevDetalles =>
      prevDetalles.map(detalle =>
        detalle.codigo === updatedDetalle.codigo ? updatedDetalle : detalle
      )
    );
  };


  const removeDetalle = (codigo) => {
    setDetalles(prevDetalles =>
      prevDetalles.filter(detalle => detalle.codigo !== codigo)
    );
  };


  return { ventas, removeVenta, currentPage, setCurrentPage, totalPages, ventasPerPage, setVentasPerPage, detalles, addVenta, addDetalle, removeDetalle, updateDetalle, totalRecaudado };
};


export default useVentasData;
