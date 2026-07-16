import api from "@/api/axios";

export interface SucursalDashboard {
  id: number;
  nombre: string;
  direccion?: string;
  ciudad?: string;
}

export interface KpiResponse {
  data: number;
  anterior: number;
  cambio: number;
  totalRegistros?: number;
}

export interface StockCriticoProduct {
  id?: number;
  nombre: string;
  codigo: string;
  stock: string | number;
}

export interface DesempenoSucursal {
  id?: number;
  nombre: string;
  ventas: number;
}

export interface DesempenoResponse {
  sucursales: DesempenoSucursal[];
  promedioGeneral: number;
}

export interface ComparacionVentas {
  total_ventas: string | number;
  fecha_inicio: string;
  fecha_fin: string;
  [key: number]: { total_ventas: string | number };
}

export interface TendenciaVenta {
  fecha: string;
  total_ventas: string | number;
}

export interface NotaPendiente {
  id_nota_almacen: number;
  num_comprobante: string;
  fecha: string;
  tipo_nota: string;
  concepto: string;
  usuario_registra: string;
  glosa: string;
  estado_espera: number;
  id_sucursal: number;
  nombre_sucursal: string;
}

// ── Endpoints de la API ───────────────────────────────────────────

export const getSucursalesDashboard = async (): Promise<SucursalDashboard[]> => {
  const response = await api.get("/dashboard/sucursales");
  return response.data?.data || [];
};

export const getVentasTotal = async (params: {
  tiempo: string;
  usuario: string;
  sucursal?: string;
}): Promise<KpiResponse> => {
  const response = await api.get("/dashboard/ventas_total", { params });
  return response.data;
};

export const getNuevosClientes = async (params: {
  tiempo: string;
  usuario: string;
  sucursal?: string;
}): Promise<{ nuevosClientes: number; nuevosClientesAnterior: number; cambio: number }> => {
  const response = await api.get("/dashboard/nuevos_clientes", { params });
  return response.data;
};

export const getProductSell = async (params: {
  tiempo: string;
  usuario: string;
  sucursal?: string;
}): Promise<{ totalProductosVendidos: number; cambio: number }> => {
  const response = await api.get("/dashboard/product_sell", { params });
  return response.data;
};

export const getNotasPendientes = async (params: {
  id_sucursal?: string;
}): Promise<NotaPendiente[]> => {
  const response = await api.get("/dashboard/notas_pendientes", { params });
  return response.data?.data || [];
};

export const getComparacionVentas = async (params: {
  fechaInicio: string;
  fechaFin: string;
  usuario: string;
  sucursal?: string;
}): Promise<any> => {
  const response = await api.get("/dashboard/comparacion_ventas", { params });
  return response.data?.data;
};

export const getVentasPorSucursal = async (params: {
  tiempo: string;
  sucursal?: string;
}): Promise<DesempenoResponse> => {
  const response = await api.get("/dashboard/ventas_por_sucursal", { params });
  if (response.data?.code === 1 && response.data?.data) {
    return response.data.data;
  }
  return { sucursales: [], promedioGeneral: 0 };
};

export const getTendenciaVentas = async (params: {
  id_sucursal?: string;
  year: string;
  month: string;
  week?: string;
}): Promise<TendenciaVenta[]> => {
  const response = await api.get("/reporte/tendencia_ventas", { params });
  return response.data?.data || [];
};

export const getProductosBajoStock = async (params: {
  sucursal?: string;
}): Promise<StockCriticoProduct[]> => {
  const response = await api.get("/kardex/stock_inicio", { params });
  return response.data?.data || [];
};

export const actualizarEstadoEspera = async (num_comprobante: string): Promise<boolean> => {
  const response = await api.post("/dashboard/actualizar_espera", { num_comprobante });
  return response.data?.code === 1;
};
