import axios from "@/api/axios";

// Ganancias totales
export const getTotalSalesRevenueRequest = () => axios.get("/reporte/ganancias");

// Productos vendidos totales
export const getTotalProductosVendidosRequest = () => axios.get("/reporte/productos_vendidos");

// PDF de ventas
export const getVentasPDFRequest = (params) => axios.get("/reporte/ventas_pdf", { params });

// Producto más vendido
export const getProductoMasVendidoRequest = () => axios.get("/reporte/producto_top");

// Cantidad de ventas por producto
export const getCantidadVentasPorProductoRequest = () => axios.get("/reporte/cantidad_por_producto");

// Cantidad de ventas por subcategoría
export const getCantidadVentasPorSubcategoriaRequest = () => axios.get("/reporte/cantidad_por_subcategoria");

// Análisis de ganancias por sucursales
export const getAnalisisGananciasSucursalesRequest = () => axios.get("/reporte/analisis_ganancias_sucursales");

// Libro de ventas SUNAT (listado)
export const getLibroVentasSunatRequest = () => axios.get("/reporte/libro_ventas_sunat");

// Exportar registro de ventas SUNAT (excel)
export const exportarRegistroVentasRequest = (params) => axios.get("/reporte/registro_ventas_sunat", { params, responseType: 'blob' });

// Sucursales
export const getSucursalesReporteRequest = () => axios.get("/reporte/sucursales");

// Sucursal con mayor rendimiento
export const getSucursalMayorRendimientoRequest = () => axios.get("/reporte/ventas_sucursal");

// Tendencia de ventas
export const getTendenciaVentasRequest = () => axios.get("/reporte/tendencia_ventas");

// Top productos por margen
export const getTopProductosMargenRequest = () => axios.get("/reporte/top_productos_margen");