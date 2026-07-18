import api from "@/api/axios";
import { unwrapList } from "@/api/http";
import type {
  KardexProducto,
  KardexAlmacen,
  KardexDetalleMovimiento,
  KardexStockAnterior,
  KardexStockMinimo,
  KardexProductoInfo,
  StockFilter,
} from "../types";

interface KardexQuery {
  almacen?: string;
  stock?: StockFilter;
}

export const getKardexProductos = async (q: KardexQuery): Promise<KardexProducto[]> => {
  const res = await api.get("/kardex", {
    params: {
      almacen: q.almacen || undefined,
      stock: q.stock && q.stock !== "todos" ? q.stock : undefined,
    },
  });
  return unwrapList<KardexProducto>(res);
};

export const getKardexAlmacenes = async (): Promise<KardexAlmacen[]> => {
  const res = await api.get("/kardex/almacen");
  return unwrapList<Record<string, unknown>>(res).map((a) => ({
    id_almacen: (a.id_almacen ?? a.id) as number,
    nom_almacen: (a.nom_almacen ?? a.nombre_almacen ?? a.nombre ?? `Almacén ${a.id_almacen ?? ""}`) as string,
  }));
};

/* ──────────────────────────────────────────────────────────
 * Detalle Kardex
 * ────────────────────────────────────────────────────────── */

export interface KardexDetalleQuery {
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  idProducto: number;
  idAlmacen?: number | "%";
}

/** Movimientos en el rango de fechas (GET /kardex/detalleK). */
export const getKardexDetalle = async (
  q: KardexDetalleQuery
): Promise<KardexDetalleMovimiento[]> => {
  const res = await api.get("/kardex/detalleK", {
    params: {
      fechaInicio: q.fechaInicio,
      fechaFin: q.fechaFin,
      idProducto: q.idProducto,
      idAlmacen: q.idAlmacen ?? "%",
    },
  });
  return unwrapList<KardexDetalleMovimiento>(res);
};

/** Saldos anteriores al rango (GET /kardex/detalleKA). */
export const getKardexDetalleAnteriores = async (
  fecha: string,
  idProducto: number,
  idAlmacen: number | "%" = "%"
): Promise<KardexStockAnterior | null> => {
  const res = await api.get("/kardex/detalleKA", {
    params: { fecha, idProducto, idAlmacen },
  });
  const list = unwrapList<KardexStockAnterior>(res);
  return list[0] ?? null;
};

/* ──────────────────────────────────────────────────────────
 * Stock mínimo
 * ────────────────────────────────────────────────────────── */

/** Productos con stock < 10 (GET /kardex/stock_inicio). */
export const getKardexStockMinimo = async (
  sucursal?: number
): Promise<KardexStockMinimo[]> => {
  const res = await api.get("/kardex/stock_inicio", {
    params: { sucursal: sucursal || undefined },
  });
  return unwrapList<KardexStockMinimo>(res);
};

/* ──────────────────────────────────────────────────────────
 * Histórico por producto (legacy /kardex/producto)
 * ────────────────────────────────────────────────────────── */

export interface KardexHistoricoQuery extends KardexDetalleQuery {}

/**
 * Llama en paralelo a detalleK, detalleKA y producto. Equivalente a
 * `getDetalleKardexCompleto` del cliente legacy.
 */
export interface KardexDetalleCompleto {
  kardex: KardexDetalleMovimiento[];
  previousTransactions: KardexStockAnterior[];
  productos: KardexProductoInfo[];
}

export const getKardexDetalleCompleto = async (
  q: KardexHistoricoQuery
): Promise<KardexDetalleCompleto> => {
  const [resKardex, resPrev, resProducto] = await Promise.all([
    api.get("/kardex/detalleK", { params: q }),
    api.get("/kardex/detalleKA", {
      params: {
        fecha: q.fechaInicio,
        idProducto: q.idProducto,
        idAlmacen: q.idAlmacen ?? "%",
      },
    }),
    api.get("/kardex/producto", { params: q }),
  ]);

  return {
    kardex: unwrapList<KardexDetalleMovimiento>(resKardex),
    previousTransactions: unwrapList<KardexStockAnterior>(resPrev),
    productos: unwrapList<KardexProductoInfo>(resProducto),
  };
};

/** Información del producto (GET /kardex/producto). */
export const getKardexProductoInfo = async (
  q: KardexHistoricoQuery
): Promise<KardexProductoInfo | null> => {
  const res = await api.get("/kardex/producto", { params: q });
  const list = unwrapList<KardexProductoInfo>(res);
  return list[0] ?? null;
};
