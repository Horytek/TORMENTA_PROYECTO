import api from "@/api/axios";
import { unwrapList } from "@/api/http";
import type { KardexProducto, KardexAlmacen, StockFilter } from "../types";

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
