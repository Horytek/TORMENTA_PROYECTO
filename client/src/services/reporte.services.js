import {
  getTotalSalesRevenueRequest,
  getTotalProductosVendidosRequest,
  getVentasPDFRequest,
  getProductoMasVendidoRequest,
  getCantidadVentasPorProductoRequest,
  getCantidadVentasPorSubcategoriaRequest,
  getAnalisisGananciasSucursalesRequest,
  getLibroVentasSunatRequest,
  exportarRegistroVentasRequest,
  getSucursalesReporteRequest,
  getSucursalMayorRendimientoRequest,
  getTendenciaVentasRequest,
  getTopProductosMargenRequest
} from "@/api/api.reporte";

// Ganancias totales
const getTotalSalesRevenue = async () => {
  const response = await getTotalSalesRevenueRequest();
  return response.data;
};

// Productos vendidos totales
const getTotalProductosVendidos = async () => {
  const response = await getTotalProductosVendidosRequest();
  return response.data;
};

// PDF de ventas
const getVentasPDF = async (params) => {
  const response = await getVentasPDFRequest(params);
  return response.data;
};

// Producto más vendido
const getProductoMasVendido = async () => {
  const response = await getProductoMasVendidoRequest();
  return response.data;
};

// Cantidad de ventas por producto
const getCantidadVentasPorProducto = async () => {
  const response = await getCantidadVentasPorProductoRequest();
  return response.data;
};

// Cantidad de ventas por subcategoría
const getCantidadVentasPorSubcategoria = async () => {
  const response = await getCantidadVentasPorSubcategoriaRequest();
  return response.data;
};

// Análisis de ganancias por sucursales
const getAnalisisGananciasSucursales = async () => {
  const response = await getAnalisisGananciasSucursalesRequest();
  return response.data;
};

// Libro de ventas SUNAT (listado)
const getLibroVentasSunat = async () => {
  const response = await getLibroVentasSunatRequest();
  return response.data;
};

// Exportar registro de ventas SUNAT (excel)
const exportarRegistroVentas = async (params) => {
  const response = await exportarRegistroVentasRequest(params);
  return response.data;
};

// Sucursales
const getSucursalesReporte = async () => {
  const response = await getSucursalesReporteRequest();
  return response.data;
};

// Sucursal con mayor rendimiento
const getSucursalMayorRendimiento = async () => {
  const response = await getSucursalMayorRendimientoRequest();
  return response.data;
};

// Tendencia de ventas
const getTendenciaVentas = async () => {
  const response = await getTendenciaVentasRequest();
  return response.data;
};

// Top productos por margen
const getTopProductosMargen = async () => {
  const response = await getTopProductosMargenRequest();
  return response.data;
};

export {
    getTotalSalesRevenue,
    getTotalProductosVendidos,
    getVentasPDF,
    getProductoMasVendido,
    getCantidadVentasPorProducto,
    getCantidadVentasPorSubcategoria,
    getAnalisisGananciasSucursales,
    getLibroVentasSunat,
    exportarRegistroVentas,
    getSucursalesReporte,
    getSucursalMayorRendimiento,
    getTendenciaVentas,
    getTopProductosMargen
}