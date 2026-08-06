import { useMemo, useState, useCallback } from "react";
import { getCategoria, type StoreProducto } from "../../../types/storefront";

export type OrdenOption = "relevancia" | "precio-asc" | "precio-desc" | "nombre-asc" | "nombre-desc";

export function useStorefrontCatalog(productos: StoreProducto[]) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [orden, setOrden] = useState<OrdenOption>("relevancia");
  const [dense, setDense] = useState(true);

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

  const filtrados = useMemo(() => {
    let lista = [...productos];
    if (categoria) {
      lista = lista.filter((p) => getCategoria(p) === categoria);
    }
    const q = busqueda.trim().toLowerCase();
    if (q) {
      lista = lista.filter((p) => {
        const hay = `${p.nombre} ${p.descripcion ?? ""} ${p.sku ?? ""} ${getCategoria(p) ?? ""}`.toLowerCase();
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
      default:
        break;
    }
    return lista;
  }, [productos, categoria, busqueda, orden]);

  const destacados = useMemo(() => {
    const conFoto = productos.filter((p) => p.imagen_url);
    const base = conFoto.length >= 2 ? conFoto : productos;
    return base.slice(0, 5);
  }, [productos]);

  const storyProductos = useMemo(() => {
    const conFoto = productos.filter((p) => p.imagen_url && p.descripcion);
    return (conFoto.length >= 1 ? conFoto : productos).slice(0, 2);
  }, [productos]);

  const selectCategoria = useCallback((cat: string | null) => {
    setCategoria(cat);
  }, []);

  return {
    busqueda,
    setBusqueda,
    categoria,
    setCategoria: selectCategoria,
    orden,
    setOrden,
    dense,
    setDense,
    categorias,
    filtrados,
    destacados,
    storyProductos,
  };
}
