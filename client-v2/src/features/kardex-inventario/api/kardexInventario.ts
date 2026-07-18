import api from "@/api/axios";
import { unwrapList } from "@/api/http";

/**
 * Cliente del módulo "kardex-inventario" del backend.
 *
 * Este módulo lee SOLO la tabla `inventario` (no usa variantes — sin producto_sku,
 * tonalidad ni talla). Es paralelo a /api/kardex, que sí usa variantes.
 *
 * Pensado para `client-v2`, que decidió operar sin variantes en su capa de
 * presentación. Si un día hay que volver a variantes, basta con reemplazar
 * este módulo por el de `features/kardex/api/kardex.ts`.
 */

export interface KardexInventarioProducto {
  codigo: number;
  descripcion: string;
  marca: string;
  stock: number;
  um: string;
  precio: number;
  cod_barras: string | null;
  estado: number;
}

export interface KardexInventarioAlmacen {
  // El backend devuelve `id`/`almacen`; aquí normalizamos al shape "largo" que usa
  // el resto de `client-v2` (id_almacen/nom_almacen) para no romper selects, etc.
  id_almacen: number;
  nom_almacen: string;
  sucursal?: string;
}

export interface KardexInventarioStockMinimo {
  codigo: number;
  nombre: string;
  marca: string;
  stock: number;
}

export interface KardexInventarioProductoInfo {
  codigo: number;
  descripcion: string;
  marca: string;
  stock: number;
}

/* ──────────────────────────────────────────────────────────
 * Detalle / Histórico (lee `bitacora_nota` vía `inventario` — sin variantes)
 * ────────────────────────────────────────────────────────── */

/** Movimiento del kardex (nota/venta) — viene de `bitacora_nota`. */
export interface KardexInventarioDetalleMovimiento {
  id: number;
  fecha: string;             // dd/mm/yyyy
  documento: string;
  nombre: string;
  entra: number;
  sale: number;
  stock: number;
  precio: number | string | null;
  glosa: string;
  hora_creacion: string | null;
  usuario?: string;
  almacen_origen?: string;
  almacen_destino?: string;
  estado_doc?: number | string | null;
  productos?: KardexInventarioProductoAgrupado[];
}

export interface KardexInventarioProductoAgrupado {
  codigo: number;
  descripcion: string;
  marca: string;
  cantidad: number;
}

/** Acumulado de movimientos previos al rango (para "Saldo anterior"). */
export interface KardexInventarioStockAnterior {
  numero: number;
  entra: number;
  sale: number;
}

export interface KardexInventarioDetalleQuery {
  fechaInicio: string;       // YYYY-MM-DD
  fechaFin: string;          // YYYY-MM-DD
  idProducto: number;
  idAlmacen?: number | "%";
}

export interface KardexInventarioDetalleCompleto {
  kardex: KardexInventarioDetalleMovimiento[];
  previousTransactions: KardexInventarioStockAnterior[];
  productos: KardexInventarioProductoInfo[];
}

export type KardexInventarioStockFilter = "" | "todos" | "con_stock" | "sin_stock";

export interface KardexInventarioFiltros {
  descripcion?: string;
  almacen?: string;
  marca?: string;
  cat?: string;
  subcat?: string;
  stock?: KardexInventarioStockFilter;
}

interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

const unwrap = <T>(res: { data: ApiResponse<T> }): T => res.data.data;

const cleanParams = (params: Record<string, unknown>) => {
  const cleaned: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, val]) => {
    if (
      val !== undefined &&
      val !== null &&
      val !== "" &&
      val !== "__all__" &&
      !(typeof val === "number" && Number.isNaN(val))
    ) {
      cleaned[key] = val;
    }
  });
  return cleaned;
};

export const getKardexInventarioProductos = async (
  filtros: KardexInventarioFiltros = {}
): Promise<KardexInventarioProducto[]> => {
  const res = await api.get<ApiResponse<KardexInventarioProducto[]>>("/kardex-inventario", {
    params: cleanParams({ ...filtros }),
  });
  return unwrap(res);
};

export const getKardexInventarioAlmacenes = async (): Promise<KardexInventarioAlmacen[]> => {
  const res = await api.get<ApiResponse<KardexInventarioAlmacen[]>>("/kardex-inventario/almacenes");
  // El backend devuelve `id` y `almacen`; el resto de `client-v2` consume `id_almacen`/
  // `nom_almacen` — normalizamos aquí para no tocar cada consumidor.
  const data = unwrap(res) ?? [];
  return data.map((a: any) => ({
    id_almacen: (a.id_almacen ?? a.id) as number,
    nom_almacen: (a.nom_almacen ?? a.almacen ?? a.nombre) as string,
    sucursal: (a.sucursal ?? undefined) as string | undefined,
  }));
};

export const getKardexInventarioStockMinimo = async (
  sucursal?: number | string
): Promise<KardexInventarioStockMinimo[]> => {
  const res = await api.get<ApiResponse<KardexInventarioStockMinimo[]>>(
    "/kardex-inventario/stock_inicio",
    { params: sucursal ? { sucursal } : {} }
  );
  return unwrap(res);
};

export const getKardexInventarioProductoInfo = async (params: {
  idProducto: number;
  idAlmacen?: number | "%";
}): Promise<KardexInventarioProductoInfo | null> => {
  const res = await api.get<ApiResponse<KardexInventarioProductoInfo[]>>(
    "/kardex-inventario/producto",
    {
      params: cleanParams({ idProducto: params.idProducto, idAlmacen: params.idAlmacen }),
    }
  );
  const list = res.data?.data ?? [];
  // El backend a veces envuelve en array; otras veces devuelve objeto. Soportamos ambos.
  if (Array.isArray(list)) return list[0] ?? null;
  return (list as unknown as KardexInventarioProductoInfo) ?? null;
};

/** Re-export util para tablas que aún llaman `unwrapList<T>(res)`. */
export const unwrapKardexInventarioList = <T>(res: { data: ApiResponse<T[] | T> }): T[] =>
  unwrapList<T>(res as never) as T[];

/* ──────────────────────────────────────────────────────────
 * Detalle / Histórico (sin variantes)
 * ────────────────────────────────────────────────────────── */

export const getKardexInventarioDetalle = async (
  q: KardexInventarioDetalleQuery
): Promise<KardexInventarioDetalleMovimiento[]> => {
  const res = await api.get<ApiResponse<KardexInventarioDetalleMovimiento[]>>(
    "/kardex-inventario/detalle",
    {
      params: cleanParams({
        fechaInicio: q.fechaInicio,
        fechaFin: q.fechaFin,
        idProducto: q.idProducto,
        idAlmacen: q.idAlmacen ?? "%",
      }),
    }
  );
  return unwrap(res) ?? [];
};

export const getKardexInventarioDetalleAnteriores = async (
  fecha: string,
  idProducto: number,
  idAlmacen: number | "%" = "%"
): Promise<KardexInventarioStockAnterior | null> => {
  const res = await api.get<ApiResponse<KardexInventarioStockAnterior[]>>(
    "/kardex-inventario/detalle-anteriores",
    {
      params: { fecha, idProducto, idAlmacen },
    }
  );
  const list = unwrap(res) ?? [];
  return list[0] ?? null;
};

export const getKardexInventarioDetalleCompleto = async (
  q: KardexInventarioDetalleQuery
): Promise<KardexInventarioDetalleCompleto> => {
  const [detalleRes, anterioresRes, productoRes] = await Promise.all([
    api.get<ApiResponse<KardexInventarioDetalleMovimiento[]>>("/kardex-inventario/detalle", {
      params: cleanParams({
        fechaInicio: q.fechaInicio,
        fechaFin: q.fechaFin,
        idProducto: q.idProducto,
        idAlmacen: q.idAlmacen ?? "%",
      }),
    }),
    api.get<ApiResponse<KardexInventarioStockAnterior[]>>(
      "/kardex-inventario/detalle-anteriores",
      { params: { fecha: q.fechaInicio, idProducto: q.idProducto, idAlmacen: q.idAlmacen ?? "%" } }
    ),
    api.get<ApiResponse<KardexInventarioProductoInfo[]>>("/kardex-inventario/producto", {
      params: cleanParams({ idProducto: q.idProducto, idAlmacen: q.idAlmacen }),
    }),
  ]);

  const kardex = (detalleRes.data?.data ?? []) as KardexInventarioDetalleMovimiento[];
  const previousTransactions = (anterioresRes.data?.data ?? []) as KardexInventarioStockAnterior[];
  const productos = (productoRes.data?.data ?? []) as KardexInventarioProductoInfo[];

  return { kardex, previousTransactions, productos };
};
