import { create } from "zustand";

export const useVentaSeleccionadaStore = create((set) => ({
  venta: null,
  boucher: null,
  detalles: [],
  datosClientes: null,
  surB: null,
  comprobante: null,     // Añadido
  comprobante1: null,
  observacion: null,
  id_usuario: null,
  total_ventas: [],

  setVentaSeleccionada: (
    venta,
    detalles,
    comprobante = null,   // Añadido
    comprobante1 = null,
    observacion = null,
    id_usuario = null
  ) =>
    set({
      venta,
      boucher: venta?.id_venta_boucher || null,
      detalles: detalles || [],
      datosClientes: venta
        ? { nombre: venta.cliente, documento: venta.ruc }
        : null,
      surB: venta
        ? { sucursal: venta.nombre_sucursal, direccion: venta.ubicacion }
        : null,
      comprobante,
      comprobante1,
      observacion,
      id_usuario: id_usuario || (venta?.u_modifica ? { id_usuario: venta.u_modifica } : null),
    }),

  setComprobante: (comprobante) => set({ comprobante }), // Setter para comprobante
  setComprobante1: (comprobante1) => set({ comprobante1 }),
  setObservacion: (observacion) => set({ observacion }),
  setIdUsuario: (id_usuario) => set({ id_usuario }),
  setTotalVentas: (total_ventas) => set({ total_ventas }),

  clearVentaSeleccionada: () =>
    set({
      venta: null,
      boucher: null,
      detalles: [],
      datosClientes: null,
      surB: null,
      comprobante: null,
      comprobante1: null,
      observacion: null,
      id_usuario: null,
      total_ventas: [],
    }),
}));