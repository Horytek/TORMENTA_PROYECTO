import axios from "@/api/axios";

// Obtener todas las ventas (con filtros por query params)
export const getVentasRequest = (params) => axios.get("/ventas", { params });

// Obtener productos de ventas
export const getProductosVentasRequest = (params) => axios.get("/ventas/producto_venta", { params });

// Agregar una nueva venta
export const addVentaRequest = (venta) => axios.post("/ventas/agregar_venta", venta);

// Obtener clientes de ventas
export const getClienteVentasRequest = () => axios.get("/ventas/cliente_venta");

// Agregar un nuevo cliente
export const addClienteRequest = (cliente) => axios.post("/ventas/cliente", cliente);

// Obtener comprobantes
export const getComprobanteRequest = () => axios.get("/ventas/comprobante");

// Obtener sucursales
export const getSucursalRequest = () => axios.get("/ventas/sucursal");

// Eliminar (anular) una venta
export const deleteVentaRequest = (data) => axios.post("/ventas/eliminar_venta", data);

// Obtener número de comprobante
export const getNumeroComprobanteRequest = (params) => axios.get("/ventas/numero_comprobante", { params });

// Actualizar estado de venta
export const updateVentaEstadoRequest = (data) => axios.post("/ventas/actualizar_venta", data);

// Obtener venta por ID (boucher)
export const getVentaByIdRequest = (params) => axios.get("/ventas/venta_boucher", { params });

// Obtener última venta
export const getLastVentaRequest = () => axios.get("/ventas/last_venta");