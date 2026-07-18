import api from "@/api/axios";
import {
  getKardexInventarioProductos as getKardexInventarioProductosApi,
  getKardexInventarioStockMinimo as getKardexInventarioStockMinimoApi,
  getKardexInventarioDetalle as getKardexInventarioDetalleApi,
  getKardexInventarioDetalleAnteriores as getKardexInventarioDetalleAnterioresApi,
  getKardexInventarioProductoInfo as getKardexInventarioProductoInfoApi,
} from "@/features/kardex-inventario/api/kardexInventario";
import type {
  KardexTransaccion,
  KardexPrevio,
  KardexProductoInfo,
  KardexDetalleParams,
  Marca,
  Categoria,
  Subcategoria,
  Almacen,
  InventarioFiltros,
  ProductoStockMinimo,
  InventarioProducto,
} from "../types";

interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

const unwrap = <T>(res: { data: ApiResponse<T> }): T => res.data.data;

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

/* ──────────────────────────────────────────────────────────
 * STOCK + CATÁLOGO (lee `inventario`, sin variantes)
 *
 * Razón: el endpoint legacy `/kardex` agregaba stock desde `inventario_stock`
 * uniendo por `producto_sku`. La página /inventory de client-v2 debe operar
 * sólo con la tabla `inventario`, así que apuntamos al módulo paralelo
 * `/kardex-inventario`. Las funciones aquí son compatibles con la UI existente.
 * ────────────────────────────────────────────────────────── */

/** Catálogo de productos con stock desde `inventario` (sin variantes). */
export const getProductos = async (
  filtros: InventarioFiltros = {}
): Promise<InventarioProducto[]> => {
  // Adaptamos `InventarioFiltros` (de este feature) al shape del módulo nuevo,
  // que es más explícito. No enviamos `idProducto`/`stock` raros.
  const payload: Record<string, unknown> = {};
  if (filtros.descripcion) payload.descripcion = filtros.descripcion;
  if (filtros.almacen) payload.almacen = filtros.almacen;
  if (filtros.marca) payload.marca = filtros.marca;
  if (filtros.cat) payload.cat = filtros.cat;
  if (filtros.subcat) payload.subcat = filtros.subcat;
  if (filtros.stock) payload.stock = filtros.stock;

  const data = await getKardexInventarioProductosApi(payload);
  // `KardexInventarioProducto` ≡ `InventarioProducto` (mismo shape garantizado).
  return data as InventarioProducto[];
};

/** Stock mínimo desde `inventario` (sin variantes). */
export const getStockMinimo = async (sucursal?: string): Promise<ProductoStockMinimo[]> => {
  const data = await getKardexInventarioStockMinimoApi(sucursal);
  // El módulo nuevo devuelve `{ codigo, nombre, marca, stock }`. InventarioProducto
  // espera `{ codigo, descripcion, marca, stock }`, así que re-mapeamos `nombre`
  // → `descripcion` (cosmético, mantienen el mismo significado).
  return data.map((p) => ({
    codigo: p.codigo,
    descripcion: p.nombre,
    marca: p.marca,
    stock: Number(p.stock) || 0,
  }));
};

/** Detalle del kardex desde `bitacora_nota` (sin variantes). */
export const getDetalleKardex = async (params: KardexDetalleParams): Promise<KardexTransaccion[]> => {
  if (!params.idProducto) return [];
  const raw = await getKardexInventarioDetalleApi({
    fechaInicio: params.fechaInicio,
    fechaFin: params.fechaFin,
    idProducto: params.idProducto,
    idAlmacen: params.idAlmacen ?? "%",
  });
  return raw as unknown as KardexTransaccion[];
};

/** Acumulado previo al rango (sin variantes). */
export const getDetalleKardexAnteriores = async (params: KardexDetalleParams): Promise<KardexPrevio | null> => {
  if (!params.idProducto) return null;
  const raw = await getKardexInventarioDetalleAnterioresApi(
    params.fechaInicio,
    params.idProducto,
    params.idAlmacen ?? "%"
  );
  if (!raw) return null;
  return {
    numero: raw.numero,
    entra: Number(raw.entra) || 0,
    sale: Number(raw.sale) || 0,
  };
};

/** Info puntual del producto con stock desde `inventario`. */
export const getInfProducto = async (params: { idProducto?: number; idAlmacen?: number }): Promise<KardexProductoInfo | null> => {
  if (!params.idProducto) return null;
  const data = await getKardexInventarioProductoInfoApi({
    idProducto: params.idProducto,
    idAlmacen: params.idAlmacen as number | "%" | undefined,
  });
  if (!data) return null;
  return {
    codigo: data.codigo,
    descripcion: data.descripcion,
    marca: data.marca,
    stock: Number(data.stock) || 0,
  };
};

/* ──────────────────────────────────────────────────────────
 * CATÁLOGOS (no usan variantes en ningún lado — son seguros)
 *
 * Mantenemos los endpoints legacy `marca`, `categoria`, `subcategoria`, `almacen`
 * por dos motivos:
 *   1. Son catálogos puros sobre `marca`/`categoria`/`sub_categoria`/`almacen`
 *      (ver kardex.controller.js:270-381). Ninguno hace JOIN con `producto_sku`
 *      ni `inventario_stock`.
 *   2. Permiten reutilizar endpoints ya existentes sin duplicar handlers.
 * ────────────────────────────────────────────────────────── */

/** GET /kardex/marca — sin variantes. */
export const getMarcas = async (): Promise<Marca[]> => {
  const res = await api.get<ApiResponse<any[]>>("/kardex/marca");
  const data = unwrap(res);
  return data.map((m) => ({
    id: m.id,
    nom_marca: m.marca || m.nom_marca || "",
  }));
};

/** GET /kardex/categoria — sin variantes. */
export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await api.get<ApiResponse<Categoria[]>>("/kardex/categoria");
  return unwrap(res);
};

/** GET /kardex/subcategoria — sin variantes. */
export const getSubcategorias = async (cat: string): Promise<Subcategoria[]> => {
  if (!cat || cat === "__all__") return [];
  const res = await api.get<ApiResponse<Subcategoria[]>>("/kardex/subcategoria", { params: { cat } });
  return unwrap(res);
};

/** GET /kardex/almacen — sin variantes (el módulo nuevo lo tiene como `/almacenes`, aliasamos). */
export const getAlmacenes = async (): Promise<Almacen[]> => {
  const res = await api.get<ApiResponse<any[]>>("/kardex/almacen");
  const data = unwrap(res);
  return data.map((a) => ({
    id: a.id,
    nom_almacen: a.almacen || a.nom_almacen || "",
  }));
};
