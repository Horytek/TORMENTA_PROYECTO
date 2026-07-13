import api from "@/api/axios";
import type {
  InventarioProducto,
  KardexMovimiento,
  KardexDetalleParams,
  Marca,
  Categoria,
  Subcategoria,
  Almacen,
  InventarioFiltros,
  ProductoStockMinimo,
} from "../types";

interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

const unwrap = <T>(res: { data: ApiResponse<T> }): T => res.data.data;

// Helper to sanitize parameters: removes "__all__", empty string, undefined, null, and NaN
const cleanParams = (params: Record<string, any>) => {
  const cleaned: Record<string, any> = {};
  Object.entries(params).forEach(([key, val]) => {
    if (
      val !== undefined &&
      val !== null &&
      val !== "" &&
      val !== "__all__" &&
      (typeof val !== "number" || !Number.isNaN(val))
    ) {
      cleaned[key] = val;
    }
  });
  return cleaned;
};

export const getProductos = async (filtros: InventarioFiltros = {}): Promise<InventarioProducto[]> => {
  const res = await api.get<ApiResponse<InventarioProducto[]>>("/kardex", { params: cleanParams(filtros) });
  return unwrap(res);
};

export const getMarcas = async (): Promise<Marca[]> => {
  const res = await api.get<ApiResponse<any[]>>("/kardex/marca");
  const data = unwrap(res);
  return data.map((m) => ({
    id: m.id,
    nom_marca: m.marca || m.nom_marca || "",
  }));
};

export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await api.get<ApiResponse<Categoria[]>>("/kardex/categoria");
  return unwrap(res);
};

export const getSubcategorias = async (cat: string): Promise<Subcategoria[]> => {
  if (!cat || cat === "__all__") return [];
  const res = await api.get<ApiResponse<Subcategoria[]>>("/kardex/subcategoria", { params: { cat } });
  return unwrap(res);
};

export const getAlmacenes = async (): Promise<Almacen[]> => {
  const res = await api.get<ApiResponse<any[]>>("/kardex/almacen");
  const data = unwrap(res);
  return data.map((a) => ({
    id: a.id,
    nom_almacen: a.almacen || a.nom_almacen || "",
  }));
};

export const getDetalleKardex = async (params: KardexDetalleParams): Promise<KardexMovimiento[]> => {
  const res = await api.get<ApiResponse<KardexMovimiento[]>>("/kardex/detalleK", { params: cleanParams(params) });
  return unwrap(res);
};

export const getStockMinimo = async (sucursal?: string): Promise<ProductoStockMinimo[]> => {
  const res = await api.get<ApiResponse<ProductoStockMinimo[]>>("/kardex/stock_inicio", {
    params: sucursal ? { sucursal } : {},
  });
  return unwrap(res);
};
