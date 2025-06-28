import { useState, useEffect } from 'react';
import { getVentasRequest } from "@/api/api.ventas";

const useVentasData = (filters) => {
  const [allVentas, setAllVentas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [ventasPerPage, setVentasPerPage] = useState(10);

  // Solo consulta la base de datos la primera vez
  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await getVentasRequest();
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
            usua_vendedor: venta.usua,
            nombre_sucursal: venta.nombre_sucursal,
            observacion: venta.observacion,
            hora_creacion: venta.hora_creacion,
            fecha_anulacion: venta.fecha_anulacion,
            u_modifica: venta.u_modifica,
            igv: `S/ ${parseFloat(venta.igv).toFixed(2)}`,
            total: `S/ ${parseFloat(venta.total).toFixed(2)}`,
            cajero: venta.cajero,
            cajeroId: venta.cajeroId,
            estado: venta.estado === 0 ? 'Anulada' :
              venta.estado === 1 ? 'Aceptada' :
                venta.estado === 2 ? 'En proceso' : 'Desconocido',
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
          setAllVentas(ventas);
        }
      } catch (error) {
        console.error('Error en la solicitud: ', error.message);
      }
    };
    fetchVentas();
  }, []);

  // Filtros y paginación locales
useEffect(() => {
  let filtradas = [...allVentas];

// Mapeo de nombres a valores numéricos
const comprobanteMap = {
  'Boleta': 1,
  'Factura': 2,
  'Nota': 3,
};
// Mapeo inverso de número a nombre
const comprobanteMapReverse = {
  1: 'Boleta',
  2: 'Factura',
  3: 'Nota',
};

// Filtro por tipo de comprobante (puede ser string de números, string de nombres, array de números o nombres)
if (filters.comprobanteSeleccionado) {
  let comprobantes = [];
  if (Array.isArray(filters.comprobanteSeleccionado)) {
    comprobantes = filters.comprobanteSeleccionado.map(tc => {
      // Si es número, lo pasamos a nombre
      if (!isNaN(tc)) return comprobanteMapReverse[Number(tc)];
      // Si es string, lo normalizamos
      return String(tc).charAt(0).toUpperCase() + String(tc).slice(1).toLowerCase();
    });
  } else if (typeof filters.comprobanteSeleccionado === 'string') {
    comprobantes = filters.comprobanteSeleccionado
      .split(',')
      .map(tc => {
        tc = tc.trim();
        // Si es número, lo pasamos a nombre
        if (!isNaN(tc)) return comprobanteMapReverse[Number(tc)];
        // Si es string, lo normalizamos
        return tc.charAt(0).toUpperCase() + tc.slice(1).toLowerCase();
      })
      .filter(tc => !!tc);
  }
  if (comprobantes.length > 0) {
    filtradas = filtradas.filter(
      v => comprobantes.includes(String(v.tipoComprobante))
    );
  }
}

  // Filtro por sucursal (exacto, string)
  if (filters.sucursalSeleccionado)
    filtradas = filtradas.filter(
      v => String(v.nombre_sucursal || '').toLowerCase() === String(filters.sucursalSeleccionado).toLowerCase()
    );

  // Filtro por razón social o nombre de cliente (inclusivo, string)
  if (filters.razon)
    filtradas = filtradas.filter(
      v => (v.cliente || '').toLowerCase().includes(String(filters.razon).toLowerCase())
    );

  // Filtro por fecha de inicio (comparación de string "YYYY-MM-DD")
  if (filters.fecha_i)
    filtradas = filtradas.filter(
      v => (v.fechaEmision || '') >= String(filters.fecha_i)
    );

  // Filtro por fecha de fin (comparación de string "YYYY-MM-DD")
  if (filters.fecha_e)
    filtradas = filtradas.filter(
      v => (v.fechaEmision || '') <= String(filters.fecha_e)
    );

  // Filtro por número de comprobante (inclusivo, string)
  if (filters.numC)
    filtradas = filtradas.filter(
      v => String(v.num || '').includes(String(filters.numC))
    );

  setTotalVentas(filtradas.length);

  // Paginación local
  const start = (currentPage - 1) * ventasPerPage;
  const end = start + ventasPerPage;
  setVentas(filtradas.slice(start, end));
}, [allVentas, filters, currentPage, ventasPerPage]);

  // Métodos locales
  const removeVenta = (id) => setAllVentas(prev => prev.filter(venta => venta.id !== id));
  const addVenta = (nuevaVenta) => setAllVentas(prev => [nuevaVenta, ...prev]);
  const updateVenta = (id, updatedData) => setAllVentas(prev =>
    prev.map(venta => venta.id === id ? { ...venta, ...updatedData } : venta)
  );

  // Totales
  const getTotalRecaudado = () => ventas.reduce((total, venta) => {
    if (venta.estado === 'Anulada') return total;
    const subtotalVenta = venta.detalles.reduce((subtotal, detalle) => {
      return subtotal + parseFloat(detalle.subtotal.replace('S/ ', ''));
    }, 0);
    return total + subtotalVenta;
  }, 0).toFixed(2);

  const getTotalPagoElectronico = () => ventas.reduce((total, venta) => {
    if (venta.estado === 'Anulada') return total;
    const pagos = venta.metodo_pago.split(', ');
    const pagosElectronicos = pagos.filter(pago => !pago.startsWith('EFECTIVO'));
    const totalElectronico = pagosElectronicos.reduce((suma, pago) => {
      const monto = parseFloat(pago.split(':')[1]) || 0;
      return suma + monto;
    }, 0);
    return total + totalElectronico;
  }, 0).toFixed(2);

  const totalRecaudado = getTotalRecaudado();
  const totalPagoElectronico = getTotalPagoElectronico();
  const totalEfectivo = (totalRecaudado - totalPagoElectronico).toFixed(2);

  return {
    ventas,
    removeVenta,
    addVenta,
    updateVenta,
    currentPage,
    setCurrentPage,
    totalPages: Math.ceil(totalVentas / ventasPerPage),
    ventasPerPage,
    setVentasPerPage,
    totalRecaudado,
    totalEfectivo,
    totalPagoElectronico
  };
};

export default useVentasData;