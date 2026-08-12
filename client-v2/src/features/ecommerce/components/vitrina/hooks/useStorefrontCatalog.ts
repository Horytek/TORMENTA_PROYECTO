import { useMemo, useCallback } from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import {
  getCategoria,
  getMarca,
  getTags,
  isDestacado,
  isStory,
  type StoreProducto,
} from "../../../types/storefront";

export type OrdenOption =
  | "relevancia"
  | "precio-asc"
  | "precio-desc"
  | "nombre-asc"
  | "nombre-desc"
  | "recientes";

export type StockFilter = "all" | "in_stock";

const ordenParser = parseAsStringEnum<OrdenOption>([
  "relevancia",
  "precio-asc",
  "precio-desc",
  "nombre-asc",
  "nombre-desc",
  "recientes",
]).withDefault("relevancia");

const stockParser = parseAsStringEnum<StockFilter>(["all", "in_stock"]).withDefault("all");
const viewParser = parseAsStringEnum<"dense" | "comfy">(["dense", "comfy"]).withDefault("dense");

export function useStorefrontCatalog(productos: StoreProducto[]) {
  const [busqueda, setBusqueda] = useQueryState("q", parseAsString.withDefault(""));
  const [categoria, setCategoriaRaw] = useQueryState("cat", parseAsString);
  const [orden, setOrden] = useQueryState("sort", ordenParser);
  const [stockFilter, setStockFilter] = useQueryState("stock", stockParser);
  const [minPrice, setMinPrice] = useQueryState("min", parseAsString);
  const [maxPrice, setMaxPrice] = useQueryState("max", parseAsString);
  const [tag, setTag] = useQueryState("tag", parseAsString);
  const [view, setView] = useQueryState("view", viewParser);

  const dense = view === "dense";
  const setDense = useCallback(
    (v: boolean) => {
      void setView(v ? "dense" : "comfy");
    },
    [setView]
  );

  const setCategoria = useCallback(
    (cat: string | null) => {
      void setCategoriaRaw(cat);
    },
    [setCategoriaRaw]
  );

  const categorias = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of productos) {
      const cat = getCategoria(p);
      if (cat) map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos]);

  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of productos) {
      for (const t of getTags(p)) map.set(t, (map.get(t) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos]);

  const priceBounds = useMemo(() => {
    if (productos.length === 0) return { min: 0, max: 0 };
    const prices = productos.map((p) => Number(p.precio));
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [productos]);

  const filtrados = useMemo(() => {
    let lista = [...productos];
    if (categoria) lista = lista.filter((p) => getCategoria(p) === categoria);
    if (tag) lista = lista.filter((p) => getTags(p).includes(tag));
    if (stockFilter === "in_stock") lista = lista.filter((p) => p.stock > 0);
    const minN = minPrice != null && minPrice !== "" ? Number(minPrice) : null;
    const maxN = maxPrice != null && maxPrice !== "" ? Number(maxPrice) : null;
    if (minN != null && Number.isFinite(minN)) lista = lista.filter((p) => Number(p.precio) >= minN);
    if (maxN != null && Number.isFinite(maxN)) lista = lista.filter((p) => Number(p.precio) <= maxN);

    const q = (busqueda || "").trim().toLowerCase();
    if (q) {
      lista = lista.filter((p) => {
        const hay = `${p.nombre} ${p.descripcion ?? ""} ${p.sku ?? ""} ${getCategoria(p) ?? ""} ${getMarca(p) ?? ""} ${getTags(p).join(" ")}`.toLowerCase();
        return hay.includes(q);
      });
    }

    switch (orden) {
      case "precio-asc":
        lista.sort((a, b) => Number(a.precio) - Number(b.precio));
        break;
      case "precio-desc":
        lista.sort((a, b) => Number(b.precio) - Number(a.precio));
        break;
      case "nombre-asc":
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case "nombre-desc":
        lista.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case "recientes":
        lista.sort((a, b) => b.id_producto - a.id_producto);
        break;
      default:
        break;
    }
    return lista;
  }, [productos, categoria, busqueda, orden, stockFilter, minPrice, maxPrice, tag]);

  const destacados = useMemo(() => {
    const flagged = productos.filter((p) => isDestacado(p) && p.imagen_url);
    if (flagged.length >= 2) return flagged.slice(0, 5);
    const conFoto = productos.filter((p) => p.imagen_url);
    return (conFoto.length >= 2 ? conFoto : productos).slice(0, 5);
  }, [productos]);

  const storyProductos = useMemo(() => {
    const flagged = productos.filter((p) => isStory(p) && p.imagen_url);
    if (flagged.length >= 1) return flagged.slice(0, 3);
    const conFoto = productos.filter((p) => p.imagen_url && p.descripcion);
    return (conFoto.length >= 1 ? conFoto : productos).slice(0, 2);
  }, [productos]);

  const clearFilters = useCallback(() => {
    void setCategoriaRaw(null);
    void setTag(null);
    void setMinPrice(null);
    void setMaxPrice(null);
    void setStockFilter("all");
    void setBusqueda("");
  }, [setCategoriaRaw, setTag, setMinPrice, setMaxPrice, setStockFilter, setBusqueda]);

  const appliedCount = [
    categoria,
    tag,
    minPrice,
    maxPrice,
    stockFilter !== "all" ? stockFilter : null,
    busqueda?.trim() || null,
  ].filter(Boolean).length;

  return {
    busqueda: busqueda || "",
    setBusqueda: (v: string) => void setBusqueda(v || null),
    categoria,
    setCategoria,
    orden: orden as OrdenOption,
    setOrden: (v: OrdenOption) => void setOrden(v),
    dense,
    setDense,
    stockFilter,
    setStockFilter: (v: StockFilter) => void setStockFilter(v),
    minPrice: minPrice || "",
    setMinPrice: (v: string) => void setMinPrice(v || null),
    maxPrice: maxPrice || "",
    setMaxPrice: (v: string) => void setMaxPrice(v || null),
    tag,
    setTag: (v: string | null) => void setTag(v),
    categorias,
    allTags,
    priceBounds,
    filtrados,
    destacados,
    storyProductos,
    clearFilters,
    appliedCount,
  };
}

export function pickProductsByIds(productos: StoreProducto[], ids?: number[], limit = 10): StoreProducto[] {
  if (!ids?.length) return [];
  const map = new Map(productos.map((p) => [p.id_producto, p]));
  return ids.map((id) => map.get(id)).filter((p): p is StoreProducto => Boolean(p)).slice(0, limit);
}

export function resolveRowProducts(
  productos: StoreProducto[],
  row: {
    mode: string;
    category?: string;
    product_ids?: number[];
    limit?: number;
  },
  excludeIds: Set<number> = new Set()
): StoreProducto[] {
  const limit = row.limit ?? 10;
  let list = productos.filter((p) => !excludeIds.has(p.id_producto));
  switch (row.mode) {
    case "ids":
      return pickProductsByIds(productos, row.product_ids, limit);
    case "category":
      if (row.category) list = list.filter((p) => getCategoria(p) === row.category);
      break;
    case "low_stock":
      list = list.filter((p) => p.stock > 0).sort((a, b) => a.stock - b.stock);
      break;
    case "price_asc":
      list = [...list].sort((a, b) => Number(a.precio) - Number(b.precio));
      break;
    case "newest":
    default:
      list = [...list].sort((a, b) => b.id_producto - a.id_producto);
      break;
  }
  return list.slice(0, limit);
}
