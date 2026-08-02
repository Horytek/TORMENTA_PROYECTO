import api from "@/api/axios";
import type {
  SucursalReporte,
  TendenciaVenta,
  ProductoVendido,
  ProductoMargen,
  GananciaSucursal,
  ReporteFiltros,
  StockAgingItem,
  VentaHeatmapPunto,
} from "../types";

export const getSucursalesReporte = async (): Promise<SucursalReporte[]> => {
  const response = await api.get("/reporte/sucursales");
  return response.data?.data || [];
};

export const getTendenciaVentas = async (params: ReporteFiltros): Promise<TendenciaVenta[]> => {
  const response = await api.get("/reporte/tendencia_ventas", { params });
  return response.data?.data || [];
};

export const getCantidadVentasPorProducto = async (params: ReporteFiltros): Promise<ProductoVendido[]> => {
  const response = await api.get("/reporte/cantidad_por_producto", { params });
  return response.data?.data || [];
};

export const getTopProductosMargen = async (params: ReporteFiltros): Promise<ProductoMargen[]> => {
  const response = await api.get("/reporte/top_productos_margen", { params });
  return response.data?.data || [];
};

export const getAnalisisGananciasSucursales = async (): Promise<GananciaSucursal[]> => {
  const response = await api.get("/reporte/analisis_ganancias_sucursales");
  return response.data?.data || [];
};

export const getStockAging = async (): Promise<StockAgingItem[]> => {
  const response = await api.get("/reporte/stock_aging");
  return response.data?.data || [];
};

export const getVentasHeatmap = async (): Promise<VentaHeatmapPunto[]> => {
  const response = await api.get("/reporte/ventas_heatmap");
  return response.data?.data || [];
};
