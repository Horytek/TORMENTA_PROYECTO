import axios from "@/api/axios";

// Ganancias totales (puede recibir id_sucursal, year, month, week)
export const getTotalSalesRevenueRequest = (params) =>
  axios.get("/reporte/ganancias", { params });

// Productos vendidos totales (puede recibir id_sucursal, year, month, week)
export const getTotalProductosVendidosRequest = (params) =>
  axios.get("/reporte/productos_vendidos", { params });

// PDF de ventas (no requiere params, pero podría recibir filtros en el futuro)
export const getVentasPDFRequest = (params) =>
  axios.get("/reporte/ventas_pdf", { params });

// Producto más vendido (puede recibir id_sucursal, year, month, week)
export const getProductoMasVendidoRequest = (params) =>
  axios.get("/reporte/producto_top", { params });

// Cantidad de ventas por producto (puede recibir id_sucursal, year, month, week)
export const getCantidadVentasPorProductoRequest = (params) =>
  axios.get("/reporte/cantidad_por_producto", { params });

// Cantidad de ventas por subcategoría (puede recibir id_sucursal, year, month, week)
export const getCantidadVentasPorSubcategoriaRequest = (params) =>
  axios.get("/reporte/cantidad_por_subcategoria", { params });

// Análisis de ganancias por sucursales (no requiere params)
export const getAnalisisGananciasSucursalesRequest = () =>
  axios.get("/reporte/analisis_ganancias_sucursales");

// Libro de ventas SUNAT (no requiere params)
export const getLibroVentasSunatRequest = () =>
  axios.get("/reporte/libro_ventas_sunat");

// Exportar registro de ventas SUNAT (requiere mes, ano, idSucursal, tipoComprobante)
export const exportarRegistroVentasRequest = (params) =>
  axios.get("/reporte/registro_ventas_sunat", { params, responseType: 'blob' });

// Sucursales (no requiere params)
export const getSucursalesReporteRequest = () =>
  axios.get("/reporte/sucursales");

// Sucursal con mayor rendimiento (puede recibir year, month, week)
export const getSucursalMayorRendimientoRequest = (params) =>
  axios.get("/reporte/ventas_sucursal", { params });

// Tendencia de ventas (puede recibir id_sucursal, year, month, week)
export const getTendenciaVentasRequest = (params) =>
  axios.get("/reporte/tendencia_ventas", { params });

// Top productos por margen (puede recibir id_sucursal, year, month, week, limit)
export const getTopProductosMargenRequest = (params) =>
  axios.get("/reporte/top_productos_margen", { params });